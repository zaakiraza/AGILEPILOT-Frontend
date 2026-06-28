import React from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  projectsApi,
  milestonesApi,
  tasksApi,
  usersApi,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls, selectCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";
import { getErrorMessage } from "../utils/errors";
import { canManageProject, projectManagerId } from "../utils/projectAccess";
import type { Milestone, Project, ProjectMember, User } from "../types/api";

const TABS = ["overview", "milestones", "members"] as const;
type Tab = (typeof TABS)[number];

const SIDEBAR_LINKS = [
  { to: "sprints", label: "Task Board" },
  { to: "estimation", label: "Estimation" },
  { to: "analytics", label: "Budget" },
  { to: "reports", label: "Reports" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  projectManager: "Project Manager",
  teamLead: "Team Lead",
  teamMember: "Team Member",
};

function roleBadgeClass(role: string) {
  if (role === "projectManager") return "bg-purple-600/20 text-purple-200 border-purple-500/30";
  if (role === "teamLead") return "bg-amber-600/20 text-amber-200 border-amber-500/30";
  return "bg-white/[0.04] text-white/60 border-white/10";
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = React.useState<Tab>("overview");
  const [project, setProject] = React.useState<Project | null>(null);
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [taskCount, setTaskCount] = React.useState(0);
  const [members, setMembers] = React.useState<ProjectMember[]>([]);
  const [pm, setPm] = React.useState<User | null>(null);
  const [orgUsers, setOrgUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [canViewMembers, setCanViewMembers] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const isAdmin = user?.orgRole === "admin";
  const isSuperAdmin = user?.orgRole === "superAdmin";
  const isPlatformAdmin = isAdmin || isSuperAdmin;

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

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const p = await projectsApi.get(id);

      const [ms, ts, mem] = await Promise.all([
        milestonesApi.list(id),
        tasksApi.list(id),
        projectsApi.listMembers(id).catch(() => null),
      ]);

      setProject(p);
      setMilestones(ms);
      setTaskCount(ts.length);

      if (mem) {
        setMembers(mem.members);
        setPm(mem.projectManager);
        setCanViewMembers(true);
      } else {
        setMembers([]);
        setPm(typeof p.projectManagerId === "object" ? p.projectManagerId : null);
        setCanViewMembers(false);
      }

      if (isPlatformAdmin) {
        usersApi
          .list()
          .then((list) => {
            const orgId = p.organizationId?.toString();
            setOrgUsers(
              list.filter(
                (u) =>
                  u.orgRole !== "superAdmin" &&
                  (!isSuperAdmin || !orgId || u.organizationId?.toString() === orgId)
              )
            );
          })
          .catch(() => {});
      }
    } catch (e: unknown) {
      setProject(null);
      setError(e instanceof Error ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [id]);

  React.useEffect(() => {
    if (!canViewMembers && tab === "members") {
      setTab("overview");
    }
  }, [canViewMembers, tab]);

  const milestoneForm = useForm<{ title: string; description?: string }>();
  const memberForm = useForm<{ userId: string }>();
  const changePmForm = useForm<{ projectManagerId: string }>();

  if (!id) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-white/40">
        Loading project…
      </div>
    );
  }
  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!project) return null;

  const pmId = projectManagerId(project);
  const canManage = canManageProject(project, user);

  const visibleTabs = TABS.filter((t) => t !== "members" || canViewMembers);

  const memberUserIds = new Set(
    members.map((m) =>
      typeof m.userId === "object" ? m.userId._id : String(m.userId)
    )
  );

  const assignableOrgUsers = orgUsers.filter(
    (u) =>
      u.isActive !== false &&
      (u.orgRole === "member" ||
        u.orgRole === "teamMember" ||
        u.orgRole === "projectManager")
  );

  const pmCandidates = assignableOrgUsers;
  const teamMemberCandidates = assignableOrgUsers.filter(
    (u) => u._id !== pmId && !memberUserIds.has(u._id)
  );

  const pmName =
    typeof project.projectManagerId === "object"
      ? project.projectManagerId.name
      : pm?.name ?? "—";

  const pmEmail =
    typeof project.projectManagerId === "object"
      ? project.projectManagerId.email
      : pm?.email ?? "";

  const teamMembers = members.filter((m) => m.projectRole !== "projectManager");
  const teamSize = (pmName !== "—" ? 1 : 0) + teamMembers.length;

  const sidebarLinks = SIDEBAR_LINKS.filter((link) => {
    if (link.to === "estimation" || link.to === "analytics") return canManage;
    if (link.to === "reports") {
      return !(!canManage && !isPlatformAdmin && !canViewMembers);
    }
    return true;
  });

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
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              clearFeedback();
            }}
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
      {actionError && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {actionError}
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-4">
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
              <div className="font-semibold">{taskCount}</div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="text-xs text-white/40 mb-3">Quick links</div>
            <div className="flex flex-wrap gap-2">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.to}
                  to={`/${link.to}?project=${id}`}
                  className="px-3 py-1.5 text-sm rounded-lg bg-purple-600/20 text-purple-200 border border-purple-500/25 hover:bg-purple-600/30"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "milestones" && (
        <div className="space-y-3">
          {canManage && (
            <form
              onSubmit={milestoneForm.handleSubmit((data) =>
                runAction(async () => {
                  await milestonesApi.create(id, data);
                  milestoneForm.reset();
                }, "Milestone created")
              )}
              className="flex flex-wrap gap-2"
            >
              <input {...milestoneForm.register("title", { required: true })} placeholder="Title" className={inputCls + " max-w-xs"} />
              <input {...milestoneForm.register("description")} placeholder="Description" className={inputCls + " max-w-xs"} />
              <LoadingButton
                type="submit"
                loading={actionLoading}
                className="px-3 py-2 bg-purple-600 rounded text-sm"
              >
                Add milestone
              </LoadingButton>
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

      {tab === "members" && (
        <div className="space-y-6 max-w-2xl">
          {isPlatformAdmin && (
            <>
              {/* ── Change PM ── */}
              <section className="p-4 bg-purple-600/5 border border-purple-500/20 rounded-xl space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-purple-200">Change project manager</h3>
                  <p className="text-xs text-white/40 mt-1">
                    The PM leads the project and manages budget & estimates. Only one PM per project.
                  </p>
                </div>
                <form
                  onSubmit={changePmForm.handleSubmit((data) =>
                    runAction(async () => {
                      await projectsApi.changeManager(id, data.projectManagerId);
                      changePmForm.reset();
                    }, "Project manager updated")
                  )}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <select
                    {...changePmForm.register("projectManagerId", { required: true })}
                    className={selectCls}
                    defaultValue={pmId}
                  >
                    <option value="">Select project manager…</option>
                    {pmCandidates.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <LoadingButton
                    type="submit"
                    loading={actionLoading}
                    className="px-4 py-2 bg-purple-600 rounded-md text-sm shrink-0"
                  >
                    {pmId ? "Change PM" : "Assign PM"}
                  </LoadingButton>
                </form>
              </section>

              {/* ── Add team member ── */}
              <section className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Add team member</h3>
                  <p className="text-xs text-white/40 mt-1">
                    Team members work on tasks. This is separate from the project manager role above.
                  </p>
                </div>
                <form
                  onSubmit={memberForm.handleSubmit((data) =>
                    runAction(async () => {
                      await projectsApi.addMember(id, data.userId);
                      memberForm.reset();
                    }, "Member added")
                  )}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <select {...memberForm.register("userId", { required: true })} className={selectCls}>
                    <option value="">Select person to add…</option>
                    {teamMemberCandidates.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <LoadingButton
                    type="submit"
                    loading={actionLoading}
                    className="px-4 py-2 bg-purple-600 rounded-md text-sm shrink-0"
                  >
                    Add to team
                  </LoadingButton>
                </form>
              </section>
            </>
          )}

          {/* ── Team roster ── */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">Team roster</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {teamSize} {teamSize === 1 ? "person" : "people"} on this project
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* PM */}
              <div className="flex items-center justify-between gap-3 p-4 bg-purple-600/5 border border-purple-500/20 rounded-xl">
                <div className="min-w-0">
                  <div className="font-medium">{pmName}</div>
                  {pmEmail && <div className="text-xs text-white/40 truncate">{pmEmail}</div>}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleBadgeClass("projectManager")}`}
                >
                  Project Manager
                </span>
              </div>

              {/* Team members */}
              {teamMembers.length === 0 ? (
                <div className="p-4 border border-dashed border-white/[0.08] rounded-xl text-sm text-white/40 text-center">
                  No team members yet — use &ldquo;Add team member&rdquo; above
                </div>
              ) : (
                teamMembers.map((m) => {
                  const u = typeof m.userId === "object" ? m.userId : null;
                  return (
                    <div
                      key={m._id}
                      className="flex items-center justify-between gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{u?.name ?? m.userId}</div>
                        {u?.email && (
                          <div className="text-xs text-white/40 truncate">{u.email}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleBadgeClass(m.projectRole)}`}
                        >
                          {ROLE_LABELS[m.projectRole] ?? m.projectRole}
                        </span>
                        {isPlatformAdmin && u && (
                          <>
                            {m.projectRole === "teamMember" && (
                              <LoadingButton
                                loading={actionLoading}
                                className="px-2.5 py-1 text-xs rounded-md border border-purple-500/40 bg-purple-600/15 text-purple-200 hover:bg-purple-600/25"
                                onClick={() =>
                                  runAction(
                                    () => projectsApi.promoteLead(id!, u._id).then(() => {}),
                                    "Member promoted to team lead"
                                  )
                                }
                              >
                                Promote lead
                              </LoadingButton>
                            )}
                            {m.projectRole === "teamLead" && (
                              <LoadingButton
                                loading={actionLoading}
                                className="px-2.5 py-1 text-xs rounded-md border border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
                                onClick={() =>
                                  runAction(
                                    () => projectsApi.demoteLead(id!, u._id).then(() => {}),
                                    "Team lead demoted"
                                  )
                                }
                              >
                                Demote
                              </LoadingButton>
                            )}
                            <LoadingButton
                              loading={actionLoading}
                              className="px-2.5 py-1 text-xs rounded-md border border-red-500/40 bg-red-600/10 text-red-300 hover:bg-red-600/20"
                              onClick={() =>
                                runAction(
                                  () => projectsApi.removeMember(id!, u._id).then(() => {}),
                                  "Member removed"
                                )
                              }
                            >
                              Remove
                            </LoadingButton>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
