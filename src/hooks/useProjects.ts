import { useEffect, useState } from "react";
import { projectsApi } from "../services/api";
import type { Project } from "../types/api";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setProjects(await projectsApi.list());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  return { projects, loading, error, reload };
}
