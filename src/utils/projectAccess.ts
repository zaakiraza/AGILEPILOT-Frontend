import type { Project, User } from "../types/api";

export function projectManagerId(project: Project | null): string {
  if (!project) return "";
  const pmRef = project.projectManagerId;
  return typeof pmRef === "object" ? pmRef._id : pmRef ?? "";
}

export function canManageProject(
  project: Project | null,
  user: User | null | undefined
): boolean {
  if (!user || !project) return false;
  if (user.orgRole === "admin" || user.orgRole === "superAdmin") return true;
  return user._id === projectManagerId(project);
}
