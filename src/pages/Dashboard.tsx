import React from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { tasksApi } from "../services/api";
import type { Task } from "../types/api";

export default function Dashboard() {
  const { projects, loading, error } = useProjects();
  const [tasks, setTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    async function loadTasks() {
      const all: Task[] = [];
      for (const p of projects.slice(0, 5)) {
        try {
          const list = await tasksApi.list(p._id);
          all.push(...list);
        } catch {
          /* skip inaccessible */
        }
      }
      setTasks(all);
    }
    if (projects.length) loadTasks();
  }, [projects]);

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Dashboard</h1>
          <p className="text-sm text-white/40">Overview of your projects</p>
        </div>
        <Link to="/projects" className="px-3 py-2 bg-white/[0.03] rounded text-sm">
          View projects
        </Link>
      </div>

      {loading && <p className="text-sm text-white/40">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-white/40">Projects</div>
          <div className="text-2xl font-bold mt-1">{projects.length}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-white/40">Tasks tracked</div>
          <div className="text-2xl font-bold mt-1">{tasks.length}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-white/40">Completion</div>
          <div className="text-2xl font-bold mt-1">{pct}%</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-white/40">Done tasks</div>
          <div className="text-2xl font-bold mt-1">{done}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/80 mb-2">Your projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p._id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm">{p.name}</h4>
                  <div className="text-xs text-white/40">{p.status} · {p.currency}</div>
                </div>
                <Link to={`/projects/${p._id}`} className="text-xs text-purple-300">
                  Open
                </Link>
              </div>
            </div>
          ))}
          {!loading && projects.length === 0 && (
            <p className="text-sm text-white/40">No projects yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
