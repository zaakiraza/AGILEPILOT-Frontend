import type { Project } from "../types/api";

const inputCls =
  "p-2 bg-white/[0.02] border border-white/[0.06] rounded text-sm text-white w-full";

export function ProjectPicker({
  projects,
  value,
  onChange,
  allowEmpty,
  label = "Project",
}: {
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
  allowEmpty?: boolean;
  label?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-white/40">{label}</span>
      <select
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowEmpty && <option value="">Select project…</option>}
        {projects.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export { inputCls };
