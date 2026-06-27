import React from "react";
import { useSearchParams } from "react-router-dom";
import { estimatesApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { ProjectPicker, inputCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";
import type { EstimateSummary } from "../types/api";

export default function Estimation() {
  const { projects, loading } = useProjects();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?._id ?? "";
  const [summary, setSummary] = React.useState<EstimateSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [contingency, setContingency] = React.useState(10);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) return;
    setError(null);
    estimatesApi
      .summary(projectId)
      .then((s) => {
        setSummary(s);
        setContingency(s.contingencyPercent);
        setNotes(s.notes ?? "");
      })
      .catch((e) => {
        setSummary(null);
        setError(e.message);
      });
  }, [projectId]);

  async function save() {
    if (!projectId) return;
    setSaving(true);
    try {
      await estimatesApi.upsert(projectId, {
        contingencyPercent: contingency,
        notes,
        lineItems: summary?.lineItems ?? [],
      });
      const s = await estimatesApi.summary(projectId);
      setSummary(s);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-bold">Cost Estimation</h2>
        <p className="text-sm text-white/40 mt-0.5">
          Labor from tasks + line items + contingency (API)
        </p>
      </div>

      {!loading && (
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => setParams({ project: id })}
        />
      )}

      {error && <p className="text-sm text-amber-400">{error}</p>}

      {summary && (
        <div className="bg-white/[0.02] border border-purple-500/20 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Labor (tasks)", value: `$${summary.laborFromTasks.toFixed(2)}` },
            { label: "Line items", value: `$${summary.lineItemsTotal.toFixed(2)}` },
            { label: "Contingency", value: `$${summary.contingencyAmount.toFixed(2)}` },
            { label: "Grand total", value: `$${summary.grandTotal.toFixed(2)}` },
          ].map((r) => (
            <div key={r.label}>
              <div className="text-[11px] text-white/40 mb-1">{r.label}</div>
              <div className="text-lg font-bold">{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {summary?.taskBreakdown?.length ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Task breakdown</h3>
          <div className="space-y-1 text-sm">
            {summary.taskBreakdown.map((t) => (
              <div key={t.taskId} className="flex justify-between text-white/70">
                <span>{t.title}</span>
                <span>${t.estimatedCost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-xs text-white/40">
          Contingency %
          <input
            type="number"
            value={contingency}
            onChange={(e) => setContingency(Number(e.target.value))}
            className={inputCls + " w-24 mt-1"}
          />
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className={inputCls + " flex-1 min-w-[200px]"}
        />
        <LoadingButton
          onClick={save}
          loading={saving}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm"
        >
          Save estimate
        </LoadingButton>
      </div>
    </div>
  );
}
