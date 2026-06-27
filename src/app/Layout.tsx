import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Zap,
  LayoutDashboard,
  BarChart3,
  GitBranch,
  FileText,
  Settings as SettingsIcon,
  ListTodo,
  Users,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LoadingButton } from "../components/LoadingButton";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: ListTodo },
    { to: "/sprints", label: "Task Board", icon: GitBranch },
    { to: "/estimation", label: "Estimation", icon: BarChart3 },
    { to: "/analytics", label: "Budget Analytics", icon: TrendingDown },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  if (user?.orgRole === "superAdmin" || user?.orgRole === "admin") {
    nav.splice(2, 0, { to: "/users", label: "Users", icon: Users });
  }

  return (
    <div className="flex h-screen bg-[#0b0b0e] text-white font-sans">
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-black/40 p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Zap size={16} />
          </div>
          <span className="font-bold">AgilePilot</span>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/25"
                    : "text-white/70 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <n.icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="text-sm text-white/70 mb-2">Signed in as</div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[11px] text-white/30">{user?.orgRole}</div>
            </div>
            <LoadingButton
              loading={loggingOut}
              onClick={handleLogout}
              className="text-xs px-2 py-1 bg-white/[0.04] rounded text-white/70 hover:bg-white/[0.06] shrink-0"
            >
              Logout
            </LoadingButton>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-14 px-6 flex items-center border-b border-white/[0.06] text-sm text-white/40">
          AgilePilot · connected to API
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
