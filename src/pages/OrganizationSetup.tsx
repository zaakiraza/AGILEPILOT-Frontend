import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { orgApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls } from "../components/ProjectPicker";
import { LoadingButton } from "../components/LoadingButton";

type Form = { name: string; slug?: string; defaultCurrency?: string };

export default function OrganizationSetup() {
  const { register, handleSubmit } = useForm<Form>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(data: Form) {
    setError(null);
    setLoading(true);
    try {
      await orgApi.create({
        name: data.name,
        slug: data.slug || undefined,
        defaultCurrency: data.defaultCurrency || undefined,
      });
      await refreshUser();
      navigate("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold">Create your organization</h2>
        <p className="text-sm text-white/40">
          As an admin, set up your organization before managing users and projects.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <input
            {...register("name", { required: true })}
            placeholder="Organization name"
            className={inputCls}
          />
          <input {...register("slug")} placeholder="Slug (optional)" className={inputCls} />
          <input
            {...register("defaultCurrency")}
            placeholder="Currency (e.g. USD)"
            className={inputCls}
          />
          {error && <div className="text-xs text-red-400">{error}</div>}
          <LoadingButton
            type="submit"
            loading={loading}
            className="w-full py-2 bg-purple-600 rounded text-white font-medium"
          >
            Create organization
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}
