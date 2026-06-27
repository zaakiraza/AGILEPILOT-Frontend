import React from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { usersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls } from "../components/ProjectPicker";
import type { User } from "../types/api";

type CreateForm = {
  name: string;
  email: string;
  password: string;
  orgRole: string;
};

export default function UsersPage() {
  const { user: actor } = useAuth();

  if (actor && actor.orgRole !== "superAdmin" && actor.orgRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = React.useState<User[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<CreateForm>({
    defaultValues: {
      orgRole: actor?.orgRole === "superAdmin" ? "admin" : "projectManager",
    },
  });

  const roleOptions =
    actor?.orgRole === "superAdmin"
      ? [{ value: "admin", label: "Admin" }]
      : [
          { value: "projectManager", label: "Project Manager" },
          { value: "teamMember", label: "Team Member" },
        ];

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
    setError(null);
    setMessage(null);
    try {
      const created = await usersApi.create(data);
      const otpNote = created.devOtp
        ? ` Dev OTP: ${created.devOtp}`
        : created.emailDelivered === false
          ? " (OTP logged on server if SMTP not configured)"
          : "";
      setMessage(`User created. Verification email sent.${otpNote}`);
      reset({ ...data, name: "", email: "", password: "" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold">User management</h2>

      <form
        onSubmit={handleSubmit(onCreate)}
        className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl space-y-2"
      >
        <h3 className="text-sm font-semibold">Create user</h3>
        <input {...register("name", { required: true })} placeholder="Name" className={inputCls} />
        <input {...register("email", { required: true })} type="email" placeholder="Email" className={inputCls} />
        <input {...register("password", { required: true, minLength: 8 })} type="password" placeholder="Password" className={inputCls} />
        <select {...register("orgRole")} className={inputCls}>
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <div className="text-xs text-red-400">{error}</div>}
        {message && <div className="text-xs text-emerald-400">{message}</div>}
        <button className="px-3 py-2 bg-purple-600 rounded text-white text-sm">Create user</button>
      </form>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-white/40 text-left border-b border-white/[0.06]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-white/[0.04]">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-white/60">{u.email}</td>
                <td className="p-3">{u.orgRole}</td>
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
    </div>
  );
}
