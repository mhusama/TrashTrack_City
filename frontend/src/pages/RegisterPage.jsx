import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES, homePathForRole } from "../config/roles.js";
import { CREW_SUB_ROLES } from "../config/teams.js";
import { authApi, teamsApi } from "../api/client.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("resident");
  const [crewSubRole, setCrewSubRole] = useState("");
  const [teamName, setTeamName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [nidFront, setNidFront] = useState(null);
  const [nidBack, setNidBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamOptions, setTeamOptions] = useState([]);
  const [previewResidentId, setPreviewResidentId] = useState("");
  const [previewTeamId, setPreviewTeamId] = useState("");

  useEffect(() => {
    if (!profilePicture) {
      setProfilePreview("");
      return;
    }
    const url = URL.createObjectURL(profilePicture);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

  useEffect(() => {
    teamsApi
      .registerOptions()
      .then((res) => setTeamOptions(res.data.teams || []))
      .catch(() => toast.error("Could not load team list"));
  }, []);

  useEffect(() => {
    if (role !== "resident") {
      setPreviewResidentId("");
      return;
    }
    let cancelled = false;
    authApi
      .registerIdPreview({ role: "resident" })
      .then((res) => {
        if (!cancelled) setPreviewResidentId(res.data.residentId || "");
      })
      .catch(() => {
        if (!cancelled) setPreviewResidentId("");
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    if (role !== "cleaning_crew" || !teamName) {
      setPreviewTeamId("");
      return;
    }
    let cancelled = false;
    authApi
      .registerIdPreview({ role: "cleaning_crew", teamName })
      .then((res) => {
        if (!cancelled) setPreviewTeamId(res.data.teamId || "");
      })
      .catch(() => {
        if (!cancelled) setPreviewTeamId("");
      });
    return () => {
      cancelled = true;
    };
  }, [role, teamName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nidFront || !nidBack) {
      toast.error("NID front and back images are required");
      return;
    }

    if (role === "cleaning_crew") {
      if (!crewSubRole) {
        toast.error("Select Team Leader or Team Member");
        return;
      }
      if (!teamName) {
        toast.error("Select your team name");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("nidNumber", nidNumber.trim());
      formData.append("password", password);
      formData.append("role", role);
      if (role === "cleaning_crew") {
        formData.append("crewSubRole", crewSubRole);
        formData.append("teamName", teamName);
      }
      if (profilePicture) formData.append("profilePicture", profilePicture);
      formData.append("nidFront", nidFront);
      formData.append("nidBack", nidBack);

      const user = await register(formData);
      toast.success("Account created");
      navigate(homePathForRole(user.role, user.crewSubRole), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mx-auto max-w-lg p-8"
    >
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <label className="register-passport-photo shrink-0 cursor-pointer">
          <span className="sr-only">Profile picture (optional)</span>
          <div className="register-passport-photo-frame flex items-center justify-center overflow-hidden border-2 border-theme-border bg-[#fce1ee]">
            {profilePreview ? (
              <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-14 w-14 text-[#6b0f1a]" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
          />
          <span className="register-passport-photo-label mt-2 block max-w-[7.5rem] text-center text-xs font-medium leading-snug text-[#6b0f1a]">
            Profile photo (optional)
          </span>
        </label>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-[#6b0f1a]">Create account</h1>
          <p className="mt-2 text-sm leading-relaxed text-black">
            Register as a resident, admin, or cleaning crew member.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 space-y-1">
            <span className="label-text">Role</span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== "cleaning_crew") {
                  setCrewSubRole("");
                  setTeamName("");
                }
              }}
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
                required
              >
                <option value="">Select…</option>
                {CREW_SUB_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {role === "resident" && (
          <label className="block space-y-1">
            <span className="label-text">Resident ID</span>
            <input
              type="text"
              readOnly
              value={previewResidentId}
              className="input-field cursor-not-allowed bg-neutral-100 font-mono text-sm"
            />
            <span className="text-xs text-black">
              Assigned automatically when you register (starts with RS, 8 characters).
            </span>
          </label>
        )}
        {role === "cleaning_crew" && crewSubRole && (
          <label className="block space-y-1">
            <span className="label-text">Team Name</span>
            <select
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select team…</option>
              {teamOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {role === "cleaning_crew" && crewSubRole && teamName && (
          <label className="block space-y-1">
            <span className="label-text">Team ID</span>
            <input
              type="text"
              readOnly
              value={previewTeamId}
              className="input-field cursor-not-allowed bg-neutral-100 font-mono text-sm"
            />
            <span className="text-xs text-black">
              Assigned automatically when you register (prefix by team number, 8 characters).
            </span>
          </label>
        )}
        <label className="block space-y-1">
          <span className="label-text">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="block space-y-1">
          <span className="label-text">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="block space-y-1">
          <span className="label-text">Phone number</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            placeholder="+880…"
          />
        </label>
        <label className="block space-y-1">
          <span className="label-text">NID number</span>
          <input
            required
            value={nidNumber}
            onChange={(e) => setNidNumber(e.target.value)}
            className="input-field"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="label-text">NID front image</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required
              onChange={(e) => setNidFront(e.target.files?.[0] || null)}
              className="input-field py-2 file:mr-2 file:rounded file:border-0 file:bg-[#6b0f1a] file:px-2 file:py-1 file:text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="label-text">NID back image</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required
              onChange={(e) => setNidBack(e.target.files?.[0] || null)}
              className="input-field py-2 file:mr-2 file:rounded file:border-0 file:bg-[#6b0f1a] file:px-2 file:py-1 file:text-white"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="label-text">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating…" : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-black">
        Already have an account?{" "}
        <Link to="/login" className="link-inline rounded px-1">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
