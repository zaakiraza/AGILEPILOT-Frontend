import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { orgApi, projectsApi, usersApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../context/AuthContext";
import { inputCls, selectCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";
import type { Organization, User } from "../types/api";

function isAssignableMember(u: User) {
  return (
    u.isActive !== false &&
    (u.orgRole === "member" ||
      u.orgRole === "teamMember" ||
      u.orgRole === "projectManager")
  );
}

export default function Projects() {
  const { projects, loading, error, reload } = useProjects();
  const { user } = useAuth();
  const isAdmin = user?.orgRole === "admin";
  const isSuperAdmin = user?.orgRole === "superAdmin";
  const canCreateProject = isAdmin || isSuperAdmin;

  const { register, handleSubmit, reset, watch } = useForm<{
    name: string;
    description?: string;
    organizationId?: string;
    projectManagerId: string;
    currency?: string;
  }>();
  const navigate = useNavigate();
  const [pms, setPms] = React.useState<User[]>([]);
  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  function closeCreateModal() {
    setShowCreateModal(false);
    setFormError(null);
    reset();
  }

  const selectedOrgId = watch("organizationId");

  React.useEffect(() => {
    if (!canCreateProject) return;

    if (isSuperAdmin) {
      Promise.all([orgApi.list(), usersApi.list()])
        .then(([orgList, userList]) => {
          setOrgs(orgList);
          setAllUsers(userList);
        })
        .catch(() => {});
      return;
    }

    usersApi
      .list()
      .then((list) => setPms(list.filter(isAssignableMember)))
      .catch(() => {});
  }, [canCreateProject, isSuperAdmin]);

  React.useEffect(() => {
    if (!isSuperAdmin || !selectedOrgId) {
      setPms([]);
      return;
    }
    setPms(
      allUsers.filter(
        (u) =>
          isAssignableMember(u) &&
          u.organizationId?.toString() === selectedOrgId
      )
    );
  }, [isSuperAdmin, selectedOrgId, allUsers]);

  async function onSubmit(data: {
    name: string;
    description?: string;
    organizationId?: string;
    projectManagerId: string;
    currency?: string;
  }) {
    setFormError(null);
    setCreating(true);
    try {
      const project = await projectsApi.create({
        name: data.name,
        description: data.description,
        projectManagerId: data.projectManagerId,
        currency: data.currency || "USD",
        status: "planning",
        ...(isSuperAdmin && data.organizationId
          ? { organizationId: data.organizationId }
          : {}),
      });
      reset();
      reload();
      setShowCreateModal(false);
      navigate(`/projects/${project._id}`);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Projects</h2>
      {loading && <p className="text-sm text-white/40">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {projects.map((p) => (
          <div key={p._id} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-white/40">{p.description || "—"}</div>
                <div className="text-[10px] text-white/30 mt-1">{p.status}</div>
              </div>
              <Link to={`/projects/${p._id}`} className="text-purple-300 text-sm">
                Open
              </Link>
            </div>
          </div>
        ))}

        {canCreateProject && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="group bg-white/[0.02] border border-dashed border-white/[0.12] p-3 rounded min-h-[88px] flex flex-col items-center justify-center gap-2 text-white/50 hover:text-purple-200 hover:border-purple-500/40 hover:bg-purple-600/5 transition cursor-pointer"
          >
            <span className="w-9 h-9 rounded-full border border-white/[0.15] group-hover:border-purple-500/50 group-hover:bg-purple-600/15 flex items-center justify-center transition">
              <Plus size={18} className="text-white/50 group-hover:text-purple-200" />
            </span>
            <span className="text-sm font-medium">Create project</span>
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={closeCreateModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="relative bg-[#141418] border border-white/[0.08] rounded-xl p-6 w-full max-w-lg space-y-3 shadow-xl"
          >
            <h3 id="create-project-title" className="text-sm font-semibold">
              Create project
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
              {isSuperAdmin && (
                <select {...register("organizationId", { required: true })} className={selectCls}>
                  <option value="">Select organization…</option>
                  {orgs.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              )}
              <input {...register("name", { required: true })} placeholder="Project name" className={inputCls} />
              <input {...register("description")} placeholder="Description" className={inputCls} />
              <input {...register("currency")} placeholder="Currency (USD)" className={inputCls} />
              <select {...register("projectManagerId", { required: true })} className={selectCls}>
                <option value="">Select project manager…</option>
                {pms.map((pm) => (
                  <option key={pm._id} value={pm._id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
              {formError && <div className="text-xs text-red-400">{formError}</div>}
              <div className="flex gap-2 pt-1">
                <LoadingButton
                  type="submit"
                  loading={creating}
                  className="px-3 py-2 bg-purple-600 rounded text-white text-sm"
                >
                  Create project
                </LoadingButton>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-3 py-2 rounded text-sm text-white/60 hover:text-white hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
