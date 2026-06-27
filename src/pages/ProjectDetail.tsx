import React from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  projectsApi,
  milestonesApi,
  tasksApi,
  usersApi,
  estimatesApi,
  budgetApi,
  reportsApi,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls } from "../components/ProjectPicker";
import type {
  Budget,
  BudgetAnalysis,
  EstimateSummary,
  Milestone,
  ProgressReport,
  Project,
  ProjectMember,
  Task,
  User,
} from "../types/api";

const TABS = [
  "overview",
  "milestones",
  "tasks",
  "members",
  "estimate",
  "budget",
  "reports",
] as const;

type Tab = (typeof TABS)[number];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = React.useState<Tab>("overview");
  const [project, setProject] = React.useState<Project | null>(null);
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [members, setMembers] = React.useState<ProjectMember[]>([]);
  const [pm, setPm] = React.useState<User | null>(null);
  const [orgUsers, setOrgUsers] = React.useState<User[]>([]);
  const [summary, setSummary] = React.useState<EstimateSummary | null>(null);
  const [budget, setBudget] = React.useState<Budget | null>(null);
  const [analysis, setAnalysis] = React.useState<BudgetAnalysis | null>(null);
  const [reports, setReports] = React.useState<ProgressReport[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const canManage =
    user?.orgRole === "admin" || user?.orgRole === "projectManager";
  const canBudget = canManage;

  async function load() {
    if (!id) return;
    setError(null);
    try {
      const p = await projectsApi.get(id);
      setProject(p);
      const [ms, ts, mem, rep] = await Promise.all([
        milestonesApi.list(id),
        tasksApi.list(id),
        projectsApi.listMembers(id),
        reportsApi.list(id).catch(() => []),
      ]);
      setMilestones(ms);
      setTasks(ts);
      setMembers(mem.members);
      setPm(mem.projectManager);
      setReports(rep);
      if (canBudget) {
        try {
          setSummary(await estimatesApi.summary(id));
        } catch {
          setSummary(null);
        }
        try {
          const b = await budgetApi.get(id);
          setBudget(b.budget);
          setAnalysis(await budgetApi.analysis(id));
        } catch {
          setBudget(null);
          setAnalysis(null);
        }
      }
      if (canManage) {
        usersApi
          .list()
          .then((list) => setOrgUsers(list.filter((u) => u.orgRole !== "superAdmin")))
          .catch(() => {});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load project");
    }
  }

  React.useEffect(() => {
    load();
  }, [id]);

  const milestoneForm = useForm<{ title: string; description?: string }>();
  const taskForm = useForm<{
    title: string;
    milestoneId: string;
    priority: string;
    estimatedHours: number;
    hourlyRate: number;
  }>();
  const memberForm = useForm<{ userId: string }>();
  const budgetForm = useForm<{ allocatedAmount: number }>();
  const expenseForm = useForm<{
    date: string;
    category: string;
    amount: number;
    description?: string;
  }>();
  const reportForm = useForm<{
    periodStart: string;
    periodEnd: string;
    manualNotes?: string;
  }>();
  const estimateForm = useForm<{
    contingencyPercent: number;
    notes?: string;
  }>();

  if (!id) return null;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!project) return <div className="text-sm text-white/40">Loading…</div>;

  const pmName =
    typeof project.projectManagerId === "object"
      ? project.projectManagerId.name
      : pm?.name ?? "—";

  const cols: { key: Task["status"]; label: string }[] = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{project.name}</h2>
          <div className="text-xs text-white/40">
            {project.description} · PM: {pmName}
          </div>
        </div>
        <Link to="/projects" className="text-sm text-purple-300">
          Back
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-xs capitalize ${
              tab === t
                ? "bg-purple-600/30 text-purple-200 border border-purple-500/30"
                : "bg-white/[0.03] text-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {msg && <div className="text-xs text-emerald-400">{msg}</div>}

      {tab === "overview" && (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
            <div className="text-xs text-white/40">Status</div>
            <div className="font-semibold">{project.status}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
            <div className="text-xs text-white/40">Milestones</div>
            <div className="font-semibold">{milestones.length}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
            <div className="text-xs text-white/40">Tasks</div>
            <div className="font-semibold">{tasks.length}</div>
          </div>
        </div>
      )}

      {tab === "milestones" && (
        <div className="space-y-3">
          {canManage && (
            <form
              onSubmit={milestoneForm.handleSubmit(async (data) => {
                await milestonesApi.create(id, data);
                milestoneForm.reset();
                setMsg("Milestone created");
                load();
              })}
              className="flex flex-wrap gap-2"
            >
              <input {...milestoneForm.register("title", { required: true })} placeholder="Title" className={inputCls + " max-w-xs"} />
              <input {...milestoneForm.register("description")} placeholder="Description" className={inputCls + " max-w-xs"} />
              <button className="px-3 py-2 bg-purple-600 rounded text-sm">Add milestone</button>
            </form>
          )}
          {milestones.map((m) => (
            <div key={m._id} className="p-3 border border-white/[0.06] rounded-lg">
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-white/40">{m.status} · {m.description}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-4">
          {canManage && milestones.length > 0 && (
            <form
              onSubmit={taskForm.handleSubmit(async (data) => {
                await tasksApi.create(id, {
                  ...data,
                  estimatedHours: Number(data.estimatedHours),
                  hourlyRate: Number(data.hourlyRate),
                  status: "todo",
                });
                taskForm.reset();
                setMsg("Task created");
                load();
              })}
              className="grid md:grid-cols-3 gap-2 bg-white/[0.02] p-3 rounded-xl"
            >
              <input {...taskForm.register("title", { required: true })} placeholder="Task title" className={inputCls} />
              <select {...taskForm.register("milestoneId", { required: true })} className={inputCls}>
                {milestones.map((m) => (
                  <option key={m._id} value={m._id}>{m.title}</option>
                ))}
              </select>
              <select {...taskForm.register("priority")} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input type="number" {...taskForm.register("estimatedHours")} placeholder="Est. hours" className={inputCls} />
              <input type="number" {...taskForm.register("hourlyRate")} placeholder="Hourly rate" className={inputCls} />
              <button className="px-3 py-2 bg-purple-600 rounded text-sm">Add task</button>
            </form>
          )}
          <div className="grid md:grid-cols-3 gap-3">
            {cols.map((col) => (
              <div key={col.key}>
                <h4 className="text-xs font-semibold text-white/50 mb-2">{col.label}</h4>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.status === col.key)
                    .map((t) => (
                      <div key={t._id} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="text-[10px] text-white/40">{t.priority}</div>
                        <select
                          className="mt-2 text-xs bg-transparent border border-white/10 rounded p-1"
                          value={t.status}
                          onChange={async (e) => {
                            await tasksApi.update(id, t._id, { status: e.target.value });
                            load();
                          }}
                        >
                          <option value="todo">todo</option>
                          <option value="in_progress">in_progress</option>
                          <option value="done">done</option>
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-3">
          <div className="p-3 border border-white/[0.06] rounded-lg">
            <div className="text-xs text-white/40">Project Manager</div>
            <div>{pmName}</div>
          </div>
          {canManage && (
            <form
              onSubmit={memberForm.handleSubmit(async (data) => {
                await projectsApi.addMember(id, data.userId);
                memberForm.reset();
                setMsg("Member added");
                load();
              })}
              className="flex gap-2"
            >
              <select {...memberForm.register("userId", { required: true })} className={inputCls}>
                <option value="">Add member…</option>
                {orgUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.orgRole})</option>
                ))}
              </select>
              <button className="px-3 py-2 bg-purple-600 rounded text-sm">Add</button>
            </form>
          )}
          {members.map((m) => {
            const u = typeof m.userId === "object" ? m.userId : null;
            return (
              <div key={m._id} className="flex justify-between p-3 border border-white/[0.06] rounded-lg">
                <div>
                  <div>{u?.name ?? m.userId}</div>
                  <div className="text-xs text-white/40">{m.projectRole}</div>
                </div>
                {canManage && u && (
                  <div className="flex gap-2">
                    {m.projectRole === "teamMember" && (
                      <button
                        className="text-xs text-purple-300"
                        onClick={async () => {
                          await projectsApi.promoteLead(id, u._id);
                          load();
                        }}
                      >
                        Promote lead
                      </button>
                    )}
                    {m.projectRole === "teamLead" && (
                      <button
                        className="text-xs text-purple-300"
                        onClick={async () => {
                          await projectsApi.demoteLead(id, u._id);
                          load();
                        }}
                      >
                        Demote
                      </button>
                    )}
                    <button
                      className="text-xs text-red-400"
                      onClick={async () => {
                        await projectsApi.removeMember(id, u._id);
                        load();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "estimate" && (
        <div className="space-y-3">
          {!canBudget ? (
            <p className="text-sm text-white/40">Estimate access: admin & PM only.</p>
          ) : (
            <>
              {summary && (
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Labor</div>
                    <div className="font-bold">${summary.laborFromTasks.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Line items</div>
                    <div className="font-bold">${summary.lineItemsTotal.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Contingency</div>
                    <div className="font-bold">${summary.contingencyAmount.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Grand total</div>
                    <div className="font-bold">${summary.grandTotal.toFixed(2)}</div>
                  </div>
                </div>
              )}
              <form
                onSubmit={estimateForm.handleSubmit(async (data) => {
                  await estimatesApi.upsert(id, {
                    contingencyPercent: Number(data.contingencyPercent),
                    notes: data.notes,
                    lineItems: summary?.lineItems ?? [],
                  });
                  setMsg("Estimate saved");
                  load();
                })}
                className="flex gap-2 items-end"
              >
                <label className="text-xs text-white/40">
                  Contingency %
                  <input type="number" {...estimateForm.register("contingencyPercent")} className={inputCls} defaultValue={summary?.contingencyPercent ?? 10} />
                </label>
                <input {...estimateForm.register("notes")} placeholder="Notes" className={inputCls} />
                <button className="px-3 py-2 bg-purple-600 rounded text-sm">Save estimate</button>
              </form>
            </>
          )}
        </div>
      )}

      {tab === "budget" && (
        <div className="space-y-3">
          {!canBudget ? (
            <p className="text-sm text-white/40">Budget access: admin & PM only.</p>
          ) : (
            <>
              <form
                onSubmit={budgetForm.handleSubmit(async (data) => {
                  await budgetApi.upsert(id, {
                    allocatedAmount: Number(data.allocatedAmount),
                    currency: project.currency,
                  });
                  setMsg("Budget saved");
                  load();
                })}
                className="flex gap-2"
              >
                <input type="number" {...budgetForm.register("allocatedAmount")} placeholder="Allocated amount" className={inputCls} defaultValue={budget?.allocatedAmount} />
                <button className="px-3 py-2 bg-purple-600 rounded text-sm">Set budget</button>
              </form>
              {analysis && (
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Spent</div>
                    <div className="font-bold">${analysis.totalSpent.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Variance</div>
                    <div className="font-bold">${analysis.variance.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg">
                    <div className="text-xs text-white/40">Utilization</div>
                    <div className="font-bold">{analysis.utilizationPercent}%</div>
                  </div>
                </div>
              )}
              <form
                onSubmit={expenseForm.handleSubmit(async (data) => {
                  await budgetApi.addExpense(id, {
                    ...data,
                    amount: Number(data.amount),
                  });
                  expenseForm.reset();
                  setMsg("Expense added");
                  load();
                })}
                className="grid md:grid-cols-4 gap-2"
              >
                <input type="date" {...expenseForm.register("date", { required: true })} className={inputCls} />
                <input {...expenseForm.register("category", { required: true })} placeholder="Category" className={inputCls} />
                <input type="number" {...expenseForm.register("amount", { required: true })} placeholder="Amount" className={inputCls} />
                <button className="px-3 py-2 bg-purple-600 rounded text-sm">Add expense</button>
              </form>
            </>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          <form
            onSubmit={reportForm.handleSubmit(async (data) => {
              await reportsApi.create(id, data);
              reportForm.reset();
              setMsg("Report submitted");
              load();
            })}
            className="grid md:grid-cols-3 gap-2 bg-white/[0.02] p-3 rounded-xl"
          >
            <input type="date" {...reportForm.register("periodStart", { required: true })} className={inputCls} />
            <input type="date" {...reportForm.register("periodEnd", { required: true })} className={inputCls} />
            <input {...reportForm.register("manualNotes")} placeholder="Notes" className={inputCls} />
            <button className="px-3 py-2 bg-purple-600 rounded text-sm">Submit report</button>
          </form>
          {reports.map((r) => (
            <div key={r._id} className="p-3 border border-white/[0.06] rounded-lg flex justify-between">
              <div>
                <div className="text-sm">
                  {r.periodStart?.slice(0, 10)} → {r.periodEnd?.slice(0, 10)}
                </div>
                <div className="text-xs text-white/40">
                  {r.autoCompletionPercent}% · {r.manualNotes}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs text-purple-300"
                  onClick={() => reportsApi.export(id, r._id, "pdf")}
                >
                  PDF
                </button>
                <button
                  className="text-xs text-purple-300"
                  onClick={() => reportsApi.export(id, r._id, "excel")}
                >
                  Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
