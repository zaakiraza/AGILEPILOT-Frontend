import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] text-white flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    user.orgRole === "admin" &&
    !user.organizationId &&
    location.pathname !== "/setup-organization"
  ) {
    return <Navigate to="/setup-organization" replace />;
  }

  return <>{children}</>;
}
