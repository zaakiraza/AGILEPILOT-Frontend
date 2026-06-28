import type { User } from "../types/api";

export function taskAssigneeIds(task: {
  assigneeId?: User | string | null;
  assigneeIds?: Array<User | string>;
}): string[] {
  if (task.assigneeIds?.length) {
    return task.assigneeIds.map((a) => (typeof a === "object" ? a._id : a));
  }
  if (task.assigneeId) {
    return [typeof task.assigneeId === "object" ? task.assigneeId._id : task.assigneeId];
  }
  return [];
}

export function taskAssigneeNames(task: {
  assigneeId?: User | string | null;
  assigneeIds?: Array<User | string>;
}): string[] {
  if (task.assigneeIds?.length) {
    return task.assigneeIds.map((a) => (typeof a === "object" ? a.name : ""));
  }
  if (typeof task.assigneeId === "object" && task.assigneeId?.name) {
    return [task.assigneeId.name];
  }
  return [];
}

export function AssigneePicker({
  candidates,
  value,
  onChange,
  disabled,
  compact,
}: {
  candidates: User[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id]
    );
  };

  return (
    <div
      className={`border border-white/[0.06] rounded bg-[#18181b] ${
        compact ? "p-1.5 max-h-24" : "p-2 max-h-32"
      } overflow-y-auto space-y-1 w-full`}
    >
      <div className="text-[10px] text-white/40">
        Assignees {compact ? "" : "(select one or more)"}
      </div>
      {candidates.length === 0 ? (
        <div className="text-[10px] text-white/30">No members available</div>
      ) : (
        candidates.map((u) => (
          <label
            key={u._id}
            className={`flex items-center gap-2 cursor-pointer ${
              compact ? "text-[10px]" : "text-xs"
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(u._id)}
              onChange={() => toggle(u._id)}
              disabled={disabled}
              className="rounded accent-purple-500"
            />
            <span>{u.name}</span>
          </label>
        ))
      )}
    </div>
  );
}
