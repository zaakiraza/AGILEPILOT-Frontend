import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authApi } from "../services/api";

type Form = { email: string; otp: string };

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const presetEmail = (location.state as { email?: string })?.email ?? "";
  const { register, handleSubmit, getValues } = useForm<Form>({
    defaultValues: { email: presetEmail },
  });
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(data: Form) {
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyEmail(data.email, data.otp);
      setMessage("Email verified! You can now sign in.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setMessage(null);
    try {
      const result = await authApi.resendOtp(getValues("email"));
      setMessage(
        result.devOtp
          ? `Code resent. Dev OTP: ${result.devOtp}`
          : result.message
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not resend");
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold">Verify your email</h2>
        <p className="text-sm text-white/40">
          Enter the 6-digit code sent to your email after an admin created your account.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <input
            {...register("email", { required: true })}
            type="email"
            placeholder="Email"
            className="w-full p-2 bg-white/[0.02] border border-white/[0.06] rounded text-sm"
          />
          <input
            {...register("otp", { required: true, pattern: /^\d{6}$/ })}
            placeholder="6-digit OTP"
            maxLength={6}
            className="w-full p-2 bg-white/[0.02] border border-white/[0.06] rounded text-sm tracking-widest"
          />
          {error && <div className="text-xs text-red-400">{error}</div>}
          {message && <div className="text-xs text-emerald-400">{message}</div>}
          <button
            disabled={loading}
            className="w-full py-2 bg-purple-600 rounded text-white font-medium"
          >
            Verify
          </button>
        </form>
        <button
          type="button"
          onClick={resend}
          className="text-sm text-purple-300 hover:underline"
        >
          Resend code
        </button>
        <div className="text-sm text-white/40">
          <Link to="/login" className="text-purple-300">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
