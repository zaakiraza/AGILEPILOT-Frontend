import React from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { usersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";
import type { User } from "../types/api";

type CreateForm = {
  name: string;
  email: string;
  password: string;
};

function orgRoleLabel(role: User["orgRole"]) {
  if (role === "admin") return "Admin";
  if (role === "superAdmin") return "Super Admin";
  return "Member";
}

export default function UsersPage() {
  const { user: actor } = useAuth();

  if (actor && actor.orgRole !== "superAdmin" && actor.orgRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = React.useState<User[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const isSuperAdmin = actor?.orgRole === "superAdmin";
  const { register, handleSubmit, reset } = useForm<CreateForm>();

  function closeCreateModal() {
    setShowCreateModal(false);
    setFormError(null);
    reset();
  }

  async function load() {
    try {
      setUsers(await usersApi.list());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function onCreate(data: CreateForm) {
    setFormError(null);
    setCreating(true);
    try {
      const created = await usersApi.create(data);
      const otpNote = created.devOtp
        ? ` Dev OTP: ${created.devOtp}`
        : created.emailDelivered === false
          ? " (OTP logged on server if SMTP not configured)"
          : "";
      setMessage(`User created. Verification email sent.${otpNote}`);
      closeCreateModal();
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">User management</h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="group shrink-0 bg-white/[0.02] border border-dashed border-white/[0.12] px-4 py-2.5 rounded-lg flex items-center gap-2 text-white/50 hover:text-purple-200 hover:border-purple-500/40 hover:bg-purple-600/5 transition cursor-pointer"
        >
          <span className="w-8 h-8 rounded-full border border-white/[0.15] group-hover:border-purple-500/50 group-hover:bg-purple-600/15 flex items-center justify-center transition">
            <Plus size={16} className="text-white/50 group-hover:text-purple-200" />
          </span>
          <span className="text-sm font-medium">Create user</span>
        </button>
      </div>

      {message && <div className="text-xs text-emerald-400">{message}</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-white/40 text-left border-b border-white/[0.06]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Account type</th>
              <th className="p-3">Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-white/[0.04]">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-white/60">{u.email}</td>
                <td className="p-3">{orgRoleLabel(u.orgRole)}</td>
                <td className="p-3">
                  {u.isEmailVerified === false ? (
                    <span className="text-amber-400">Pending</span>
                  ) : (
                    <span className="text-emerald-400">Yes</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            aria-labelledby="create-user-title"
            className="relative bg-[#141418] border border-white/[0.08] rounded-xl p-6 w-full max-w-lg space-y-3 shadow-xl"
          >
            <h3 id="create-user-title" className="text-sm font-semibold">
              Create user
            </h3>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-2">
              <input {...register("name", { required: true })} placeholder="Name" className={inputCls} />
              <input {...register("email", { required: true })} type="email" placeholder="Email" className={inputCls} />
              <input
                {...register("password", { required: true, minLength: 8 })}
                type="password"
                placeholder="Password"
                className={inputCls}
              />
              {isSuperAdmin ? (
                <p className="text-xs text-white/40">Creates an organization admin account.</p>
              ) : (
                <p className="text-xs text-white/40">
                  Creates an organization member. Assign project manager, team lead, or team member per project.
                </p>
              )}
              {formError && <div className="text-xs text-red-400">{formError}</div>}
              <div className="flex gap-2 pt-1">
                <LoadingButton
                  type="submit"
                  loading={creating}
                  className="px-3 py-2 bg-purple-600 rounded text-white text-sm"
                >
                  Create user
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
