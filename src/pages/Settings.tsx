import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { orgApi } from "../services/api";
import type { Organization } from "../types/api";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [org, setOrg] = React.useState<Organization | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.orgRole === "admin" && user.organizationId) {
      orgApi
        .mine()
        .then(setOrg)
        .catch((e) => setError(e.message));
    }
  }, [user]);

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>

      <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
        <div className="mb-2 text-sm text-white/40">Profile</div>
        <div className="font-medium">{user?.name}</div>
        <div className="text-xs text-white/40">{user?.email}</div>
        <div className="text-xs text-white/40 mt-1">Role: {user?.orgRole}</div>
        <div className="text-xs text-white/40">
          Email verified:{" "}
          {user?.isEmailVerified === false ? "No" : "Yes"}
        </div>
        <button
          onClick={() => refreshUser()}
          className="mt-3 text-xs px-3 py-1 bg-white/[0.04] rounded"
        >
          Refresh profile
        </button>
      </div>

      {user?.orgRole === "admin" && org && (
        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
          <div className="text-sm text-white/40 mb-1">Organization</div>
          <div className="font-medium">{org.name}</div>
          <div className="text-xs text-white/40">Slug: {org.slug}</div>
          <div className="text-xs text-white/40">
            Currency: {org.settings?.defaultCurrency ?? "USD"}
          </div>
        </div>
      )}

      {(user?.orgRole === "superAdmin" || user?.orgRole === "admin") && (
        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
          <h3 className="font-semibold text-sm mb-2">Admin</h3>
          <Link to="/users" className="text-sm text-purple-300 hover:underline">
            Manage users →
          </Link>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
