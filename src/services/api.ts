import { API_BASE_URL } from "../config";
import type {
  ApiEnvelope,
  Budget,
  BudgetAnalysis,
  BudgetExpense,
  CostEstimate,
  EstimateSummary,
  Milestone,
  Organization,
  ProgressReport,
  Project,
  ProjectMember,
  Task,
  TaskComment,
  User,
} from "../types/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("ap_token");
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, ...init } = options;
  const headers: Record<string, string> = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const json = isJson ? await res.json() : null;

  if (!res.ok || json?.status === "error") {
    throw new ApiError(json?.message ?? res.statusText, res.status);
  }

  if (json && "data" in json) {
    return (json as ApiEnvelope<T>).data;
  }

  return json as T;
}

async function download(
  path: string,
  filename: string
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(json?.message ?? "Download failed", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: User }>("/api/auth/me").then((d) => d.user),

  verifyEmail: (email: string, otp: string) =>
    request<{ user: User }>("/api/auth/verify-email", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, otp }),
    }),

  resendOtp: (email: string) =>
    request<{ message: string; devOtp?: string }>("/api/auth/resend-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email }),
    }),
};

// ─── Users ──────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => request<{ users: User[] }>("/api/users").then((d) => d.users),
  get: (id: string) => request<{ user: User }>(`/api/users/${id}`).then((d) => d.user),
  create: (body: {
    name: string;
    email: string;
    password: string;
    orgRole: string;
  }) =>
    request<{ user: User & { devOtp?: string; emailDelivered?: boolean } }>(
      "/api/users",
      { method: "POST", body: JSON.stringify(body) }
    ).then((d) => d.user),
  update: (id: string, body: Record<string, unknown>) =>
    request<{ user: User }>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((d) => d.user),
  deactivate: (id: string) =>
    request<{ user: User }>(`/api/users/${id}/deactivate`, { method: "PATCH" }).then(
      (d) => d.user
    ),
};

// ─── Organizations ──────────────────────────────────────────────────────────

export const orgApi = {
  create: (body: { name: string; slug?: string; defaultCurrency?: string }) =>
    request<{ organization: Organization; admin: User }>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  mine: () =>
    request<{ organization: Organization }>("/api/organizations/me").then(
      (d) => d.organization
    ),
  list: () =>
    request<{ organizations: Organization[] }>("/api/organizations").then(
      (d) => d.organizations
    ),
};

// ─── Projects ───────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () =>
    request<{ projects: Project[] }>("/api/projects").then((d) => d.projects),
  get: (projectId: string) =>
    request<{ project: Project }>(`/api/projects/${projectId}`).then(
      (d) => d.project
    ),
  create: (body: Record<string, unknown>) =>
    request<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((d) => d.project),
  update: (projectId: string, body: Record<string, unknown>) =>
    request<{ project: Project }>(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((d) => d.project),
  remove: (projectId: string) =>
    request<{ deleted: boolean }>(`/api/projects/${projectId}`, {
      method: "DELETE",
    }),
  changeManager: (projectId: string, projectManagerId: string) =>
    request<{ project: Project }>(`/api/projects/${projectId}/change-manager`, {
      method: "PATCH",
      body: JSON.stringify({ projectManagerId }),
    }).then((d) => d.project),

  listMembers: (projectId: string) =>
    request<{
      projectManager: User;
      members: ProjectMember[];
    }>(`/api/projects/${projectId}/members`),
  addMember: (projectId: string, userId: string) =>
    request<{ member: ProjectMember }>(`/api/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }).then((d) => d.member),
  removeMember: (projectId: string, userId: string) =>
    request<{ removed: boolean }>(
      `/api/projects/${projectId}/members/${userId}`,
      { method: "DELETE" }
    ),
  promoteLead: (projectId: string, userId: string) =>
    request<{ member: ProjectMember }>(
      `/api/projects/${projectId}/members/${userId}/promote-lead`,
      { method: "PATCH" }
    ).then((d) => d.member),
  demoteLead: (projectId: string, userId: string) =>
    request<{ member: ProjectMember }>(
      `/api/projects/${projectId}/members/${userId}/demote-lead`,
      { method: "PATCH" }
    ).then((d) => d.member),
};

// ─── Milestones ─────────────────────────────────────────────────────────────

export const milestonesApi = {
  list: (projectId: string) =>
    request<{ milestones: Milestone[] }>(
      `/api/projects/${projectId}/milestones`
    ).then((d) => d.milestones),
  create: (projectId: string, body: Record<string, unknown>) =>
    request<{ milestone: Milestone }>(
      `/api/projects/${projectId}/milestones`,
      { method: "POST", body: JSON.stringify(body) }
    ).then((d) => d.milestone),
  update: (projectId: string, milestoneId: string, body: Record<string, unknown>) =>
    request<{ milestone: Milestone }>(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      { method: "PUT", body: JSON.stringify(body) }
    ).then((d) => d.milestone),
  remove: (projectId: string, milestoneId: string) =>
    request<{ deleted: boolean }>(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      { method: "DELETE" }
    ),
};

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (projectId: string, milestoneId?: string) => {
    const q = milestoneId ? `?milestoneId=${milestoneId}` : "";
    return request<{ tasks: Task[] }>(
      `/api/projects/${projectId}/tasks${q}`
    ).then((d) => d.tasks);
  },
  create: (projectId: string, body: Record<string, unknown>) =>
    request<{ task: Task }>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((d) => d.task),
  update: (projectId: string, taskId: string, body: Record<string, unknown>) =>
    request<{ task: Task }>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((d) => d.task),
  remove: (projectId: string, taskId: string) =>
    request<{ deleted: boolean }>(
      `/api/projects/${projectId}/tasks/${taskId}`,
      { method: "DELETE" }
    ),
  addComment: (projectId: string, taskId: string, text: string) =>
    request<{ comment: TaskComment }>(
      `/api/projects/${projectId}/tasks/${taskId}/comments`,
      { method: "POST", body: JSON.stringify({ text }) }
    ).then((d) => d.comment),
  listComments: (projectId: string, taskId: string) =>
    request<{ comments: TaskComment[] }>(
      `/api/projects/${projectId}/tasks/${taskId}/comments`
    ).then((d) => d.comments),
};

// ─── Estimates ──────────────────────────────────────────────────────────────

export const estimatesApi = {
  get: (projectId: string) =>
    request<{ estimate: CostEstimate | null; currency: string }>(
      `/api/projects/${projectId}/estimate`
    ),
  summary: (projectId: string) =>
    request<{ summary: EstimateSummary }>(
      `/api/projects/${projectId}/estimate/summary`
    ).then((d) => d.summary),
  upsert: (projectId: string, body: Record<string, unknown>) =>
    request<{ estimate: CostEstimate }>(`/api/projects/${projectId}/estimate`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((d) => d.estimate),
};

// ─── Budget ─────────────────────────────────────────────────────────────────

export const budgetApi = {
  get: (projectId: string) =>
    request<{ budget: Budget | null; currency: string }>(
      `/api/projects/${projectId}/budget`
    ),
  upsert: (projectId: string, body: { allocatedAmount: number; currency?: string }) =>
    request<{ budget: Budget }>(`/api/projects/${projectId}/budget`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((d) => d.budget),
  analysis: (projectId: string) =>
    request<{ analysis: BudgetAnalysis }>(
      `/api/projects/${projectId}/budget/analysis`
    ).then((d) => d.analysis),
  addExpense: (
    projectId: string,
    body: { date: string; category: string; amount: number; description?: string }
  ) =>
    request<{ expense: BudgetExpense }>(
      `/api/projects/${projectId}/budget/expenses`,
      { method: "POST", body: JSON.stringify(body) }
    ).then((d) => d.expense),
  removeExpense: (projectId: string, expenseId: string) =>
    request<{ deleted: boolean }>(
      `/api/projects/${projectId}/budget/expenses/${expenseId}`,
      { method: "DELETE" }
    ),
};

// ─── Reports ────────────────────────────────────────────────────────────────

export const reportsApi = {
  list: (projectId: string) =>
    request<{ reports: ProgressReport[] }>(
      `/api/projects/${projectId}/reports`
    ).then((d) => d.reports),
  get: (projectId: string, reportId: string) =>
    request<{ report: ProgressReport }>(
      `/api/projects/${projectId}/reports/${reportId}`
    ).then((d) => d.report),
  create: (projectId: string, body: Record<string, unknown>) =>
    request<{ report: ProgressReport }>(`/api/projects/${projectId}/reports`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((d) => d.report),
  export: (projectId: string, reportId: string, format: "pdf" | "excel") =>
    download(
      `/api/projects/${projectId}/reports/${reportId}/export?format=${format}`,
      `progress-report.${format === "pdf" ? "pdf" : "xls"}`
    ),
};
