import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { orgApi, projectsApi, usersApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../context/AuthContext";
import { inputCls } from "../components/ProjectPicker";
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
      </div>

      {canCreateProject && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-lg bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl space-y-2"
        >
          <h3 className="text-sm font-semibold">Create project</h3>
          {isSuperAdmin && (
            <select {...register("organizationId", { required: true })} className={inputCls}>
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
          <select {...register("projectManagerId", { required: true })} className={inputCls}>
            <option value="">Select project manager…</option>
            {pms.map((pm) => (
              <option key={pm._id} value={pm._id}>
                {pm.name} ({pm.email})
              </option>
            ))}
          </select>
          {formError && <div className="text-xs text-red-400">{formError}</div>}
          <LoadingButton
            type="submit"
            loading={creating}
            className="px-3 py-2 bg-purple-600 rounded text-white text-sm"
          >
            Create project
          </LoadingButton>
        </form>
      )}
    </div>
  );
}
