import React from "react";
import { useSearchParams } from "react-router-dom";
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
import { ProjectPicker } from "../components/ProjectPicker";
import type { BudgetAnalysis } from "../types/api";

export default function Analytics() {
  const { projects, loading } = useProjects();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?._id ?? "";
  const [analysis, setAnalysis] = React.useState<BudgetAnalysis | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!projectId) return;
    setError(null);
    budgetApi
      .analysis(projectId)
      .then(setAnalysis)
      .catch((e) => {
        setAnalysis(null);
        setError(e.message);
      });
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
      <h2 className="text-lg font-bold">Budget Analytics</h2>
      <p className="text-sm text-white/40">Variance, utilization & burn rate from API</p>

      {!loading && (
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => setParams({ project: id })}
        />
      )}

      {error && <p className="text-sm text-amber-400">{error}</p>}

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
