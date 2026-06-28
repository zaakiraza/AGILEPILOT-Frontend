import React from "react";
import { useForm } from "react-hook-form";
import { tasksApi, milestonesApi, projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls, selectCls } from "./ProjectPicker";
import { AssigneePicker, taskAssigneeIds, taskAssigneeNames } from "./AssigneePicker";
import { LoadingButton } from "./LoadingButton";
import { getErrorMessage } from "../utils/errors";
import { canManageProject } from "../utils/projectAccess";
import type { Milestone, Project, ProjectMember, Task, User } from "../types/api";

export default function TaskBoard({
  projectId,
  project,
  milestoneFilter = "",
}: {
  projectId: string;
  project: Project;
  milestoneFilter?: string;
}) {
  const { user } = useAuth();
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [members, setMembers] = React.useState<ProjectMember[]>([]);
  const [pm, setPm] = React.useState<User | null>(null);
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<string[]>([]);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const canManage = canManageProject(project, user);

  const taskForm = useForm<{
    title: string;
    milestoneId: string;
    priority: string;
    estimatedHours: number;
    hourlyRate: number;
  }>();

  async function load() {
    const [ms, ts, mem] = await Promise.all([
      milestonesApi.list(projectId),
      tasksApi.list(projectId, milestoneFilter || undefined),
      projectsApi.listMembers(projectId).catch(() => null),
    ]);
    setMilestones(ms);
    setTasks(ts);
    if (mem) {
      setMembers(mem.members);
      setPm(mem.projectManager);
    } else {
      setMembers([]);
      setPm(typeof project.projectManagerId === "object" ? project.projectManagerId : null);
    }
  }

  React.useEffect(() => {
    if (!projectId) return;
    load().catch(() => {});
  }, [projectId, milestoneFilter]);

  function clearFeedback() {
    setMsg(null);
    setActionError(null);
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    clearFeedback();
    setActionLoading(true);
    try {
      await action();
      setMsg(successMessage);
      await load();
    } catch (e: unknown) {
      setActionError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  const assigneeCandidates: User[] = [];
  const assigneeSeen = new Set<string>();
  const addAssignee = (u: User | string | null | undefined) => {
    if (!u || typeof u === "string") return;
    if (assigneeSeen.has(u._id)) return;
    assigneeSeen.add(u._id);
    assigneeCandidates.push(u);
  };
  if (typeof project.projectManagerId === "object") {
    addAssignee(project.projectManagerId);
  }
  addAssignee(pm);
  members.forEach((m) => {
    if (typeof m.userId === "object") addAssignee(m.userId);
  });

  const cols: { key: Task["status"]; label: string }[] = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="space-y-4">
      {msg && <div className="text-xs text-emerald-400">{msg}</div>}
      {actionError && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {actionError}
        </div>
      )}

      {canManage && milestones.length > 0 && (
        <form
          onSubmit={taskForm.handleSubmit((data) =>
            runAction(async () => {
              await tasksApi.create(projectId, {
                ...data,
                assigneeIds: newTaskAssignees,
                estimatedHours: Number(data.estimatedHours),
                hourlyRate: Number(data.hourlyRate) || 0,
                status: "todo",
              });
              taskForm.reset();
              setNewTaskAssignees([]);
            }, "Task created")
          )}
          className="grid md:grid-cols-3 gap-2 bg-white/[0.02] p-3 rounded-xl"
        >
          <input {...taskForm.register("title", { required: true })} placeholder="Task title" className={inputCls} />
          <select {...taskForm.register("milestoneId", { required: true })} className={selectCls}>
            {milestones.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
          <AssigneePicker
            candidates={assigneeCandidates}
            value={newTaskAssignees}
            onChange={setNewTaskAssignees}
          />
          <select {...taskForm.register("priority")} className={selectCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input type="number" {...taskForm.register("estimatedHours")} placeholder="Est. hours" className={inputCls} />
          <label className="block">
            <input
              type="number"
              {...taskForm.register("hourlyRate")}
              placeholder="Hourly rate"
              className={inputCls}
              title="Used for cost estimation: estimated hours × hourly rate"
            />
            <span className="text-[10px] text-white/35 mt-0.5 block">
              For cost estimate (hours × rate)
            </span>
          </label>
          <LoadingButton
            type="submit"
            loading={actionLoading}
            className="px-3 py-2 bg-purple-600 rounded text-sm"
          >
            Add task
          </LoadingButton>
        </form>
      )}

      {canManage && milestones.length === 0 && (
        <p className="text-sm text-white/40">
          Add milestones on the project page before creating tasks.
        </p>
      )}

      <div className="grid md:grid-cols-3 border border-white/10 rounded-xl overflow-hidden divide-x divide-white/10">
        {cols.map((col) => (
          <div key={col.key} className="p-3 min-h-[12rem]">
            <h4 className="text-xs font-semibold text-white/50 mb-2 pb-2 border-b border-white/10">
              {col.label}
            </h4>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === col.key)
                .map((t) => {
                  const assigneeIds = taskAssigneeIds(t);
                  const assigneeLabel = taskAssigneeNames(t).join(", ");
                  const canUpdateTask = canManage || assigneeIds.includes(user?._id ?? "");

                  return (
                    <div key={t._id} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-[10px] text-white/40">
                        {t.priority}
                        {assigneeLabel ? ` · ${assigneeLabel}` : " · Unassigned"}
                      </div>
                      {canManage && (
                        <div className="mt-2">
                          <AssigneePicker
                            compact
                            candidates={assigneeCandidates}
                            value={assigneeIds}
                            onChange={async (ids) => {
                              clearFeedback();
                              try {
                                await tasksApi.update(projectId, t._id, { assigneeIds: ids });
                                await load();
                              } catch (err: unknown) {
                                setActionError(getErrorMessage(err));
                              }
                            }}
                          />
                        </div>
                      )}
                      {canUpdateTask ? (
                        <select
                          className={`${selectCls} mt-2 text-xs`}
                          value={t.status}
                          onChange={async (e) => {
                            clearFeedback();
                            try {
                              await tasksApi.update(projectId, t._id, {
                                status: e.target.value as Task["status"],
                              });
                              await load();
                            } catch (err: unknown) {
                              setActionError(getErrorMessage(err));
                            }
                          }}
                        >
                          <option value="todo">todo</option>
                          <option value="in_progress">in_progress</option>
                          <option value="done">done</option>
                        </select>
                      ) : (
                        <div className="mt-2 text-[10px] text-white/30 capitalize">
                          {t.status.replace("_", " ")}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
