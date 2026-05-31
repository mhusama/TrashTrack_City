import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES, homePathForRole } from "../config/roles.js";
import { CREW_SUB_ROLES } from "../config/teams.js";

const STORAGE_KEY = "trashtrack_city_saved_emails_v1";

function readSavedEmails() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEmailEntry(email, role, crewSubRole) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const list = readSavedEmails().filter(
    (x) =>
      !(
        String(x.email).toLowerCase() === normalized &&
        x.role === role &&
        (x.crewSubRole || "") === (crewSubRole || "")
      )
  );
  list.unshift({
    email: email.trim(),
    role,
    crewSubRole: crewSubRole || "",
    ts: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 60)));
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("resident");
  const [crewSubRole, setCrewSubRole] = useState("team_leader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const datalistId = "ttc-login-email-suggestions";

  const emailSuggestions = useMemo(() => {
    const all = readSavedEmails();
    return all.filter((x) => {
      if (x.role !== role) return false;
      if (role === "cleaning_crew" && (x.crewSubRole || "") !== crewSubRole) return false;
      return Boolean(x.email);
    });
  }, [role, crewSubRole]);

  const roleTitle =
    role === "admin"
      ? "Admin sign in"
      : role === "cleaning_crew"
        ? "Cleaning crew sign in"
        : "Resident sign in";

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email address first");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: trimmed });

      if (res.data.emailSent === false && res.data.devResetUrl) {
        console.info("[dev] Password reset link:", res.data.devResetUrl);
        toast.error(
          (res.data.smtpError || "SMTP not configured") +
            " — open the browser console (F12) for your reset link.",
          { duration: 8000 }
        );
        window.open(res.data.devResetUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (res.data.emailSent === false) {
        toast.error(res.data.message || "Could not send reset email. Check SMTP settings.");
        return;
      }

      toast.success(res.data.message);
    } catch (err) {
      const data = err.response?.data;
      if (data?.devResetUrl) {
        window.open(data.devResetUrl, "_blank", "noopener,noreferrer");
      }
      toast.error(data?.message || "Could not send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(
        email,
        password,
        role,
        role === "cleaning_crew" ? crewSubRole : ""
      );
      saveEmailEntry(email, role, role === "cleaning_crew" ? crewSubRole : "");
      toast.success(`Welcome back, ${user.name}`);
      navigate(homePathForRole(user.role, user.crewSubRole), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
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
      <h1 className="text-2xl font-bold text-[#6b0f1a]">{roleTitle}</h1>
      <p className="mt-1 text-sm text-black">Select your role and enter your credentials.</p>

      <datalist id={datalistId}>
        {emailSuggestions.map((entry) => (
          <option key={`${entry.email}-${entry.role}-${entry.crewSubRole}`} value={entry.email} />
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 space-y-1">
            <span className="label-text">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {role === "cleaning_crew" && (
            <label className="block flex-1 space-y-1">
              <span className="label-text">Crew role</span>
              <select
                value={crewSubRole}
                onChange={(e) => setCrewSubRole(e.target.value)}
                className="input-field"
              >
                {CREW_SUB_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="block space-y-1">
          <span className="label-text">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            list={datalistId}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="block space-y-1">
          <span className="label-text">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={forgotLoading || loading}
            className="text-sm font-medium text-[#6b0f1a] underline-offset-2 transition-colors hover:underline disabled:opacity-60"
          >
            {forgotLoading ? "Sending reset link…" : "Forgot password?"}
          </button>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-black">
        No account?{" "}
        <Link to="/register" className="link-inline rounded px-1">
          Register
        </Link>
      </p>
    </motion.div>
  );
}
