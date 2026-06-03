import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi } from "../api/client.js";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email address first");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: trimmed });
      if (res.data.emailSent === false && res.data.devResetUrl) {
        console.info("[dev] Password reset link:", res.data.devResetUrl);
        toast.success(
          "Reset link generated. Check the console or open the reset URL in a new tab."
        );
        window.open(res.data.devResetUrl, "_blank", "noopener,noreferrer");
        navigate("/login", { replace: true });
        return;
      }
      toast.success(res.data.message || "Password reset link sent if the email exists.");
      navigate("/login", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.devResetUrl) {
        window.open(data.devResetUrl, "_blank", "noopener,noreferrer");
      }
      toast.error(data?.message || "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card mx-auto max-w-md p-8"
    >
      <h1 className="text-2xl font-bold text-black">Forgot password</h1>
      <p className="mt-1 text-sm text-black">
        Enter the email address for your TrashTrack City account and we&apos;ll send a reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-1">
          <span className="label-text">Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Sending reset link…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-black">
        <Link to="/login" className="link-inline rounded px-1">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
