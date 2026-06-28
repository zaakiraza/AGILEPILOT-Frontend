import React from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { reportsApi } from "../services/api";
import { useProjects } from "../hooks/useProjects";
import { useProjectAccess } from "../hooks/useProjectAccess";
import { useBusyAction } from "../hooks/useBusyAction";
import { ProjectPicker, inputCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";
import type { ProgressReport } from "../types/api";

export default function Reports() {
  const { projects, loading: projectsLoading } = useProjects();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?._id ?? "";
  const { isTeamMemberOnly, loading: accessLoading } = useProjectAccess(projectId);
  const [reports, setReports] = React.useState<ProgressReport[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const { run, isBusy } = useBusyAction();
  const { register, handleSubmit, reset } = useForm<{
    periodStart: string;
    periodEnd: string;
    manualNotes?: string;
  }>();

  async function load() {
    if (!projectId || isTeamMemberOnly) {
      setReports([]);
      return;
    }
    setReports(await reportsApi.list(projectId));
  }

  React.useEffect(() => {
    load();
  }, [projectId, isTeamMemberOnly]);

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold">Progress Reports</h2>

      {!projectsLoading && (
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => setParams({ project: id })}
        />
      )}

      {accessLoading && <p className="text-sm text-white/40">Loading…</p>}

      {isTeamMemberOnly && !accessLoading && (
        <p className="text-sm text-white/40">
          Progress reports are not available for your role on this project.
        </p>
      )}

      {!isTeamMemberOnly && (
        <>
          <form
            onSubmit={handleSubmit(async (data) => {
              if (!projectId) return;
              setSubmitting(true);
              try {
                await reportsApi.create(projectId, data);
                reset();
                await load();
              } finally {
                setSubmitting(false);
              }
            })}
            className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl grid md:grid-cols-3 gap-2"
          >
            <input type="date" {...register("periodStart", { required: true })} className={inputCls} />
            <input type="date" {...register("periodEnd", { required: true })} className={inputCls} />
            <input {...register("manualNotes")} placeholder="Manual notes" className={inputCls} />
            <LoadingButton
              type="submit"
              loading={submitting}
              className="px-3 py-2 bg-purple-600 rounded text-sm text-white md:col-span-3 w-fit"
            >
              Submit report
            </LoadingButton>
          </form>

          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r._id}
                className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl flex justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-medium">
                    {r.periodStart?.slice(0, 10)} → {r.periodEnd?.slice(0, 10)}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    Auto completion: {r.autoCompletionPercent}%
                  </div>
                  <div className="text-xs text-white/50 mt-1">{r.manualNotes}</div>
                </div>
                {projectId && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <LoadingButton
                      loading={isBusy(`pdf-${r._id}`)}
                      className="text-xs text-purple-300 hover:underline bg-transparent p-0 justify-start"
                      onClick={() =>
                        run(`pdf-${r._id}`, () => reportsApi.export(projectId, r._id, "pdf"))
                      }
                    >
                      Download PDF
                    </LoadingButton>
                    <LoadingButton
                      loading={isBusy(`excel-${r._id}`)}
                      className="text-xs text-purple-300 hover:underline bg-transparent p-0 justify-start"
                      onClick={() =>
                        run(`excel-${r._id}`, () => reportsApi.export(projectId, r._id, "excel"))
                      }
                    >
                      Download Excel
                    </LoadingButton>
                  </div>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <p className="text-sm text-white/40">No reports for this project yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
