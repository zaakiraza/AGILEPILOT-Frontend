import React from "react";
import { useSearchParams } from "react-router-dom";
import { milestonesApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { useProjectAccess } from "../hooks/useProjectAccess";
import { ProjectPicker, selectCls } from "../components/ProjectPicker";
import TaskBoard from "../components/TaskBoard";
import type { Milestone } from "../types/api";

export default function Sprints() {
  const { projects, loading: projectsLoading } = useProjects();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?._id ?? "";
  const { project, loading: projectLoading } = useProjectAccess(projectId);
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [milestoneFilter, setMilestoneFilter] = React.useState("");

  React.useEffect(() => {
    if (!projectId) return;
    milestonesApi.list(projectId).then(setMilestones);
  }, [projectId]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Task Board</h2>
      <p className="text-sm text-white/40">Create and manage tasks across projects</p>

      {projectsLoading ? (
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
              className={selectCls}
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

      {projectLoading && <p className="text-sm text-white/40">Loading…</p>}
      {project && (
        <TaskBoard
          projectId={projectId}
          project={project}
          milestoneFilter={milestoneFilter}
        />
      )}
    </div>
  );
}
