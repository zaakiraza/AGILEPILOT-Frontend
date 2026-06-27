import React, { useState } from "react";
import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  FileText,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  Plus,
  ChevronRight,
  Target,
  Clock,
  Users,
  TrendingDown,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flame,
  Zap,
  User,
  MoreHorizontal,
  Download,
  CalendarDays,
  ListTodo,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

// ─── Types ─────────────────────────────────────────────────────────────────

type Priority = "critical" | "high" | "medium" | "low";
type Status = "todo" | "inprogress" | "done";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  assignee: string;
  initials: string;
  progress: number;
  status: Status;
  estimate: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────

const tasks: Task[] = [
  { id: "AP-101", title: "Design authentication flow wireframes", priority: "high", assignee: "Sarah K.", initials: "SK", progress: 0, status: "todo", estimate: "3h" },
  { id: "AP-102", title: "Set up CI/CD pipeline with GitHub Actions", priority: "medium", assignee: "James R.", initials: "JR", progress: 0, status: "todo", estimate: "5h" },
  { id: "AP-103", title: "Write API documentation for /users endpoint", priority: "low", assignee: "Priya M.", initials: "PM", progress: 0, status: "todo", estimate: "2h" },
  { id: "AP-104", title: "Implement JWT token refresh mechanism", priority: "critical", assignee: "Daniel W.", initials: "DW", progress: 65, status: "inprogress", estimate: "6h" },
  { id: "AP-105", title: "Build sprint planning kanban component", priority: "high", assignee: "Sarah K.", initials: "SK", progress: 80, status: "inprogress", estimate: "8h" },
  { id: "AP-106", title: "Integrate Stripe payment webhooks", priority: "medium", assignee: "James R.", initials: "JR", progress: 40, status: "inprogress", estimate: "4h" },
  { id: "AP-107", title: "Migrate legacy auth to OAuth 2.0", priority: "high", assignee: "Priya M.", initials: "PM", progress: 100, status: "done", estimate: "10h" },
  { id: "AP-108", title: "Performance audit — reduce LCP to <2.5s", priority: "medium", assignee: "Daniel W.", initials: "DW", progress: 100, status: "done", estimate: "5h" },
  { id: "AP-109", title: "Unit tests for estimation module", priority: "low", assignee: "James R.", initials: "JR", progress: 100, status: "done", estimate: "3h" },
];

const teamMembers = [
  { name: "Sarah Kim", initials: "SK", role: "Frontend", tasks: 4, capacity: 72, color: "#8B5CF6" },
  { name: "James Reed", initials: "JR", role: "Backend", tasks: 3, capacity: 55, color: "#6D28D9" },
  { name: "Priya Mehta", initials: "PM", role: "Design", tasks: 2, capacity: 40, color: "#A78BFA" },
  { name: "Daniel Wu", initials: "DW", role: "DevOps", tasks: 2, capacity: 60, color: "#7C3AED" },
];

const burndownData = [
  { day: "Day 1", ideal: 42, actual: 42 },
  { day: "Day 2", ideal: 38, actual: 39 },
  { day: "Day 3", ideal: 34, actual: 36 },
  { day: "Day 4", ideal: 30, actual: 31 },
  { day: "Day 5", ideal: 26, actual: 28 },
  { day: "Day 6", ideal: 22, actual: 24 },
  { day: "Day 7", ideal: 18, actual: 19 },
  { day: "Day 8", ideal: 14, actual: 15 },
  { day: "Day 9", ideal: 10, actual: 11 },
  { day: "Day 10", ideal: 6, actual: null },
  { day: "Day 11", ideal: 2, actual: null },
  { day: "Day 12", ideal: 0, actual: null },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: "Critical", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: <Flame size={10} /> },
  high: { label: "High", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: <AlertCircle size={10} /> },
  medium: { label: "Medium", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: <Zap size={10} /> },
  low: { label: "Low", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: <Circle size={10} /> },
};

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = priorityConfig[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border", cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function Avatar({ initials, color = "#6D28D9", size = "sm" }: { initials: string; color?: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", dim)}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function ProgressBar({ value, color = "#8B5CF6" }: { value: number; color?: string }) {
  return (
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const memberColor = teamMembers.find(m => m.initials === task.initials)?.color ?? "#6D28D9";
  return (
    <div className="group bg-white/[0.03] border border-white/8 rounded-xl p-3.5 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="text-[10px] text-white/30 font-mono">{task.id}</span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70">
          <MoreHorizontal size={14} />
        </button>
      </div>
      <p className="text-sm text-white/85 font-medium leading-snug mb-3">{task.title}</p>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <PriorityBadge priority={task.priority} />
        <span className="text-[10px] text-white/30 flex items-center gap-1">
          <Clock size={9} /> {task.estimate}
        </span>
      </div>
      <ProgressBar value={task.progress} color={memberColor} />
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          <Avatar initials={task.initials} color={memberColor} size="sm" />
          <span className="text-[11px] text-white/40">{task.assignee}</span>
        </div>
        {task.progress > 0 && (
          <span className="text-[10px] text-white/30">{task.progress}%</span>
        )}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Estimation", icon: BarChart3, id: "estimation" },
  { label: "Sprint Planning", icon: GitBranch, id: "sprint" },
  { label: "Analytics", icon: TrendingDown, id: "analytics" },
  { label: "Reports", icon: FileText, id: "reports" },
  { label: "Settings", icon: Settings, id: "settings" },
];

export default function App() {
  const [activeNav, setActiveNav] = useState("sprint");
  const [darkMode, setDarkMode] = useState(true);
  const [notifications] = useState(3);

  const todoTasks = tasks.filter(t => t.status === "todo");
  const inprogressTasks = tasks.filter(t => t.status === "inprogress");
  const doneTasks = tasks.filter(t => t.status === "done");

  const completedCount = doneTasks.length;
  const totalCount = tasks.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex h-screen bg-[#09090B] text-white overflow-hidden font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-xl">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">AgilePilot</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/25"
                    : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                )}
              >
                <item.icon size={15} className={active ? "text-purple-400" : ""} />
                {item.label}
                {active && <ChevronRight size={12} className="ml-auto text-purple-400/60" />}
              </button>
            );
          })}
        </nav>

        {/* Sprint label */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Active Sprint</p>
          <p className="text-xs text-white/60 font-medium">Sprint 7 — Q2 2025</p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-white/30 mb-1">
              <span>Progress</span><span>{completionPct}%</span>
            </div>
            <ProgressBar value={completionPct} />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Navbar ── */}
        <header className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl">
          {/* Search */}
          <div className="flex-1 max-w-xs relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search tasks, sprints..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/70 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-all"
            >
              {darkMode ? <Moon size={13} /> : <Sun size={13} />}
            </button>

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-all">
              <Bell size={13} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-violet-700 flex items-center justify-center text-[11px] font-semibold">
                AK
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-white/80">Alex Kim</p>
                <p className="text-[10px] text-white/30">Scrum Master</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* Page header + actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Sprint Planning</h1>
                <p className="text-xs text-white/35 mt-0.5">Sprint 7 · May 14 – May 27, 2025</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white/85 hover:bg-white/[0.07] transition-all">
                  <Download size={12} /> Generate Report
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white/85 hover:bg-white/[0.07] transition-all">
                  <ListTodo size={12} /> Add Task
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium transition-all shadow-lg shadow-purple-900/40">
                  <Plus size={12} /> Create Sprint
                </button>
              </div>
            </div>

            {/* ── Sprint Overview Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Sprint Name", value: "Sprint 7", sub: "Q2 2025 Cycle", icon: <GitBranch size={14} />, accent: "#8B5CF6" },
                { label: "Duration", value: "14 Days", sub: "May 14 – May 27", icon: <CalendarDays size={14} />, accent: "#6D28D9" },
                { label: "Sprint Goal", value: "Auth & CI/CD", sub: "Core platform stability", icon: <Target size={14} />, accent: "#A78BFA" },
                { label: "Team Capacity", value: "227 hrs", sub: "Across 4 members", icon: <Users size={14} />, accent: "#7C3AED" },
              ].map(card => (
                <div
                  key={card.label}
                  className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:border-purple-500/25 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-white/35 uppercase tracking-widest">{card.label}</span>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.accent}20`, color: card.accent }}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-base font-bold text-white">{card.value}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Kanban + Workload row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Kanban — spans 2 cols */}
              <div className="lg:col-span-2 grid grid-cols-3 gap-3">
                {(
                  [
                    { id: "todo", label: "To Do", tasks: todoTasks, dot: "#6B7280", count: todoTasks.length },
                    { id: "inprogress", label: "In Progress", tasks: inprogressTasks, dot: "#8B5CF6", count: inprogressTasks.length },
                    { id: "done", label: "Done", tasks: doneTasks, dot: "#10B981", count: doneTasks.length },
                  ] as const
                ).map(col => (
                  <div key={col.id} className="flex flex-col gap-2">
                    {/* Column header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                        <span className="text-xs font-semibold text-white/70">{col.label}</span>
                      </div>
                      <span className="text-[10px] text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded-md">
                        {col.count}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2 min-h-[200px]">
                      {col.tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>

                    {/* Add card */}
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/[0.08] text-[11px] text-white/25 hover:text-white/50 hover:border-white/20 transition-all">
                      <Plus size={12} /> Add task
                    </button>
                  </div>
                ))}
              </div>

              {/* Team Workload */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white/80">Team Workload</h2>
                  <Users size={14} className="text-white/25" />
                </div>
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div key={member.name}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <Avatar initials={member.initials} color={member.color} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/80 truncate">{member.name}</p>
                          <p className="text-[10px] text-white/30">{member.role} · {member.tasks} tasks</p>
                        </div>
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: member.capacity > 65 ? "#F87171" : member.color }}
                        >
                          {member.capacity}%
                        </span>
                      </div>
                      <ProgressBar
                        value={member.capacity}
                        color={member.capacity > 65 ? "#F87171" : member.color}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Sprint Progress ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Burndown chart */}
              <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white/80">Burndown Chart</h2>
                    <p className="text-[11px] text-white/30 mt-0.5">Remaining story points over sprint duration</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/35">
                    <span className="flex items-center gap-1.5"><span className="w-5 h-px bg-purple-400 inline-block rounded" /> Ideal</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-px bg-emerald-400 inline-block rounded" /> Actual</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={burndownData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#13131A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                      itemStyle={{ color: "#8B5CF6" }}
                    />
                    <Area type="monotone" dataKey="ideal" stroke="#8B5CF6" strokeWidth={1.5} fill="url(#idealGrad)" strokeDasharray="4 3" connectNulls={false} dot={false} />
                    <Area type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} fill="url(#actualGrad)" dot={false} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats column */}
              <div className="flex flex-col gap-3">
                {/* Completion */}
                <div className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white/70">Sprint Completion</h3>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  {/* Radial-style circle */}
                  <div className="flex items-center justify-center my-2">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle
                          cx="40" cy="40" r="32" fill="none"
                          stroke="#8B5CF6" strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionPct / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-white">{completionPct}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30 text-center">{completedCount} of {totalCount} tasks done</p>
                </div>

                {/* Remaining */}
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-white/70">Remaining Tasks</h3>
                    <Clock size={13} className="text-white/25" />
                  </div>
                  <p className="text-2xl font-bold text-white">{totalCount - completedCount}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">5 days left in sprint</p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-orange-400/10 text-orange-400 border border-orange-400/15">
                      {inprogressTasks.length} in progress
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/[0.05] text-white/35 border border-white/[0.08]">
                      {todoTasks.length} backlog
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
