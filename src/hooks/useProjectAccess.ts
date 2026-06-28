import { useEffect, useState } from "react";
import { projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canManageProject } from "../utils/projectAccess";
import type { Project } from "../types/api";

export function useProjectAccess(projectId: string) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [canViewMembers, setCanViewMembers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      projectsApi.get(projectId),
      projectsApi.listMembers(projectId).then(() => true).catch(() => false),
    ])
      .then(([p, hasMembersAccess]) => {
        setProject(p);
        setCanViewMembers(hasMembersAccess);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const isPlatformAdmin =
    user?.orgRole === "admin" || user?.orgRole === "superAdmin";
  const canManage = canManageProject(project, user);
  const isTeamMemberOnly = !canManage && !isPlatformAdmin && !canViewMembers;

  return {
    project,
    canManage,
    isPlatformAdmin,
    isTeamMemberOnly,
    canViewMembers,
    loading,
  };
}
