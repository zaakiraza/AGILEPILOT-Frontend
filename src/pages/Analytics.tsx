import React from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { budgetApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { useProjectAccess } from "../hooks/useProjectAccess";
import { ProjectPicker, inputCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";
import type { Budget, BudgetAnalysis } from "../types/api";

export default function Analytics() {
  const { projects, loading: projectsLoading } = useProjects();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?._id ?? "";
  const { project, canManage, loading: accessLoading } = useProjectAccess(projectId);
  const [budget, setBudget] = React.useState<Budget | null>(null);
  const [analysis, setAnalysis] = React.useState<BudgetAnalysis | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [addingExpense, setAddingExpense] = React.useState(false);

  const budgetForm = useForm<{ allocatedAmount: number }>();
  const expenseForm = useForm<{
    date: string;
    category: string;
    amount: number;
    description?: string;
  }>();

  async function load() {
    if (!projectId) return;
    setError(null);
    try {
      const b = await budgetApi.get(projectId);
      setBudget(b.budget);
      setAnalysis(await budgetApi.analysis(projectId));
    } catch (e: unknown) {
      setBudget(null);
      setAnalysis(null);
      setError(e instanceof Error ? e.message : "Failed to load budget");
    }
  }

  React.useEffect(() => {
    load();
  }, [projectId]);

  const chartData = analysis
    ? [
        { name: "Allocated", value: analysis.allocatedAmount },
        { name: "Spent", value: analysis.totalSpent },
        { name: "Estimated", value: analysis.estimatedCost },
      ]
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Budget</h2>
      <p className="text-sm text-white/40">
        Set budget, track expenses, and view analytics
      </p>

      {!projectsLoading && (
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => setParams({ project: id })}
        />
      )}

      {accessLoading && <p className="text-sm text-white/40">Loading…</p>}

      {!canManage && !accessLoading && project && (
        <p className="text-sm text-white/40">Budget management: admin & PM only.</p>
      )}

      {error && <p className="text-sm text-amber-400">{error}</p>}

      {canManage && project && (
        <>
          <form
            onSubmit={budgetForm.handleSubmit(async (data) => {
              setSaving(true);
              try {
                await budgetApi.upsert(projectId, {
                  allocatedAmount: Number(data.allocatedAmount),
                  currency: project.currency,
                });
                await load();
              } finally {
                setSaving(false);
              }
            })}
            className="flex flex-wrap gap-2 items-end bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl"
          >
            <input
              type="number"
              {...budgetForm.register("allocatedAmount")}
              placeholder="Allocated amount"
              className={inputCls + " max-w-xs"}
              defaultValue={budget?.allocatedAmount}
            />
            <LoadingButton
              type="submit"
              loading={saving}
              className="px-3 py-2 bg-purple-600 rounded text-sm"
            >
              Set budget
            </LoadingButton>
          </form>

          <form
            onSubmit={expenseForm.handleSubmit(async (data) => {
              setAddingExpense(true);
              try {
                await budgetApi.addExpense(projectId, {
                  ...data,
                  amount: Number(data.amount),
                });
                expenseForm.reset();
                await load();
              } finally {
                setAddingExpense(false);
              }
            })}
            className="grid md:grid-cols-4 gap-2 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl"
          >
            <input type="date" {...expenseForm.register("date", { required: true })} className={inputCls} />
            <input {...expenseForm.register("category", { required: true })} placeholder="Category" className={inputCls} />
            <input type="number" {...expenseForm.register("amount", { required: true })} placeholder="Amount" className={inputCls} />
            <LoadingButton
              type="submit"
              loading={addingExpense}
              className="px-3 py-2 bg-purple-600 rounded text-sm"
            >
              Add expense
            </LoadingButton>
          </form>
        </>
      )}

      {analysis && (
        <>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { label: "Allocated", value: `$${analysis.allocatedAmount.toFixed(2)}` },
              { label: "Total spent", value: `$${analysis.totalSpent.toFixed(2)}` },
              { label: "Variance", value: `$${analysis.variance.toFixed(2)}` },
              { label: "Burn / week", value: `$${analysis.burnRatePerWeek.toFixed(2)}` },
            ].map((c) => (
              <div key={c.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <div className="text-xs text-white/40">{c.label}</div>
                <div className="text-xl font-bold mt-1">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Budget comparison</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-sm text-white/50">
            Utilization: {analysis.utilizationPercent}% · Labor: $
            {analysis.actualLaborCost.toFixed(2)} · Expenses: $
            {analysis.expensesTotal.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}
