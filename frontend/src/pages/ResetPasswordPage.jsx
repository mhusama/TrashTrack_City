import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import AuthFormSpacer from "../components/AuthFormSpacer.jsx";

function readTokenFromUrl(searchParams) {
  const raw = searchParams.get("token");
  if (!raw) return "";
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const token = readTokenFromUrl(searchParams);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenHint, setTokenHint] = useState(null);

  useEffect(() => {
    if (!token) return;

    authApi
      .validateResetToken(token)
      .then((res) => setTokenHint(res.data.valid ? "valid" : "invalid"))
      .catch(() => setTokenHint("unknown"));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, password, confirmPassword });
      logout();
      toast.success(res.data.message || "Password updated. Sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card card mx-auto max-w-md p-8 text-center"
      >
        <h1 className="text-2xl font-bold text-black">Missing reset link</h1>
        <p className="mt-3 text-sm text-black">
          Use the link from your email, or request a new one from the sign-in page.
        </p>
        <Link to="/login" className="link-inline mt-6 inline-block rounded px-2 py-1">
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="auth-card card mx-auto max-w-md p-8"
    >
      <h1 className="text-2xl font-bold text-black">Set new password</h1>
      <p className="mt-1 text-sm text-black">
        Enter a new password for your account. This works for any registered user (resident or
        admin).
      </p>

      {tokenHint === "invalid" && (
        <p className="mt-3 rounded-lg border border-theme-border bg-[#fce1ee] px-3 py-2 text-sm text-[#6b0f1a]">
          This link may have expired (links last 2 minutes). You can still try below, or request a
          new link from sign in.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-1">
          <span className="label-text">New password</span>
          <PasswordInput
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block space-y-1">
          <span className="label-text">Confirm new password</span>
          <PasswordInput
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-black">
        <Link to="/login" className="link-inline rounded px-1">
          Back to sign in
        </Link>
      </p>
      <AuthFormSpacer />
    </motion.div>
  );
}
