import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold">Account creation</h2>
        <p className="text-sm text-white/50">
          Accounts are created by a <strong>superAdmin</strong> or <strong>admin</strong>.
          You will receive an email OTP to verify before your first login.
        </p>
        <div className="text-sm space-y-2">
          <Link to="/verify-email" className="block text-purple-300 hover:underline">
            Verify email with OTP →
          </Link>
          <Link to="/login" className="block text-purple-300 hover:underline">
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
