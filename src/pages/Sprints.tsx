import React from "react";
import { useSearchParams } from "react-router-dom";
import { tasksApi, milestonesApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { ProjectPicker } from "../components/ProjectPicker";
import type { Milestone, Task } from "../types/api";

export default function Sprints() {
  const { projects, loading } = useProjects();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?._id ?? "";
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [milestoneFilter, setMilestoneFilter] = React.useState("");

  React.useEffect(() => {
    if (!projectId) return;
    Promise.all([
      milestonesApi.list(projectId),
      tasksApi.list(projectId, milestoneFilter || undefined),
    ]).then(([ms, ts]) => {
      setMilestones(ms);
      setTasks(ts);
    });
  }, [projectId, milestoneFilter]);

  const cols: { key: Task["status"]; label: string; color: string }[] = [
    { key: "todo", label: "To Do", color: "#6B7280" },
    { key: "in_progress", label: "In Progress", color: "#8B5CF6" },
    { key: "done", label: "Done", color: "#10B981" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Task Board</h2>
      <p className="text-sm text-white/40">Kanban view of project tasks (milestones from API)</p>

      {loading ? (
        <p className="text-sm text-white/40">Loading projects…</p>
      ) : (
        <div className="flex flex-wrap gap-3 items-end">
          <ProjectPicker
            projects={projects}
            value={projectId}
            onChange={(id) => setParams({ project: id })}
          />
          <label className="block space-y-1">
            <span className="text-xs text-white/40">Milestone</span>
            <select
              className="p-2 bg-white/[0.02] border border-white/[0.06] rounded text-sm"
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
            >
              <option value="">All milestones</option>
              {milestones.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {cols.map((col) => (
          <div key={col.key} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 min-h-[240px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="ml-auto text-xs text-white/30">
                {tasks.filter((t) => t.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === col.key)
                .map((t) => (
                  <div
                    key={t._id}
                    className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg"
                  >
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-[10px] text-white/40 mt-1">{t.priority}</div>
                    {projectId && (
                      <select
                        className="mt-2 w-full text-xs bg-transparent border border-white/10 rounded p-1"
                        value={t.status}
                        onChange={async (e) => {
                          await tasksApi.update(projectId, t._id, {
                            status: e.target.value,
                          });
                          const ts = await tasksApi.list(
                            projectId,
                            milestoneFilter || undefined
                          );
                          setTasks(ts);
                        }}
                      >
                        <option value="todo">todo</option>
                        <option value="in_progress">in_progress</option>
                        <option value="done">done</option>
                      </select>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
