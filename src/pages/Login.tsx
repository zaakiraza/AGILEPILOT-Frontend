import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { LoadingButton } from "../components/LoadingButton";

type Form = { email: string; password: string };

export default function Login() {
  const { register, handleSubmit } = useForm<Form>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(data: Form) {
    setError(null);
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      if (user.orgRole === "admin" && !user.organizationId) {
        navigate("/setup-organization");
      } else {
        navigate("/dashboard");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      if (msg.toLowerCase().includes("email not verified")) {
        navigate("/verify-email", { state: { email: data.email } });
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-xl font-bold mb-2">Welcome back</h2>
        <p className="text-sm text-white/40 mb-4">Sign in to AgilePilot</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            {...register("email", { required: true })}
            type="email"
            placeholder="Email"
            className="w-full p-2 bg-white/[0.02] border border-white/[0.06] rounded text-sm"
          />
          <input
            {...register("password", { required: true })}
            type="password"
            placeholder="Password"
            className="w-full p-2 bg-white/[0.02] border border-white/[0.06] rounded text-sm"
          />
          {error && <div className="text-xs text-red-400">{error}</div>}
          <LoadingButton
            type="submit"
            loading={loading}
            className="w-full py-2 bg-purple-600 rounded text-white font-medium"
          >
            Sign in
          </LoadingButton>
        </form>

        <div className="mt-4 text-sm text-white/40 space-y-1">
          <div>
            Need to verify email?{" "}
            <Link to="/verify-email" className="text-purple-300">
              Enter OTP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
