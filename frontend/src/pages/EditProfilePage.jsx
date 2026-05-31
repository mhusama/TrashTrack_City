import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserCircle } from "lucide-react";
import { authApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../config/roles.js";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      confirmPassword: "",
    });
    setPreview(user.profilePicture ? mediaUrl(user.profilePicture) : "");
  }, [user]);

  useEffect(() => {
    if (!profilePicture) return;
    const url = URL.createObjectURL(profilePicture);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim());
      if (form.password) fd.append("password", form.password);
      if (profilePicture) fd.append("profilePicture", profilePicture);

      const { data } = await authApi.updateProfile(fd);
      setUser(data.user);
      toast.success("Profile updated");
      navigate(homePathForRole(data.user.role, data.user.crewSubRole));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 text-black">
      <Link
        to={homePathForRole(user.role, user.crewSubRole)}
        className="text-sm font-medium text-[#6b0f1a] hover:underline"
      >
        ← Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-[#6b0f1a]">Edit Profile</h1>
      <p className="text-sm text-black">
        Update your details and profile photo. NID number and NID images cannot be changed here.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <label className="flex cursor-pointer items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-theme-border bg-[#fce1ee]">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-12 w-12 text-[#6b0f1a]" />
            )}
          </div>
          <span className="text-sm font-medium text-[#6b0f1a]">Change profile photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
          />
        </label>

        <label className="block space-y-1">
          <span className="label-text">Full name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
        </label>

        <label className="block space-y-1">
          <span className="label-text">Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
          />
        </label>

        <label className="block space-y-1">
          <span className="label-text">Phone</span>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input-field"
          />
        </label>

        <div className="rounded-xl border border-theme-border bg-[#fce1ee]/30 p-3 text-sm">
          <p className="font-medium text-[#6b0f1a]">NID (read-only)</p>
          <p className="mt-1">NID number: {user.nidNumber || "—"}</p>
          <p className="mt-1 text-xs text-black">
            Contact support if your NID details need to be corrected.
          </p>
        </div>

        {(user.residentId || user.teamId) && (
          <div className="rounded-xl border border-theme-border bg-white p-3 text-sm text-black">
            {user.residentId ? (
              <p>
                <span className="font-medium text-[#6b0f1a]">Resident ID: </span>
                <span className="font-mono">{user.residentId}</span>
              </p>
            ) : null}
            {user.teamId ? (
              <p className={user.residentId ? "mt-2" : ""}>
                <span className="font-medium text-[#6b0f1a]">Team ID: </span>
                <span className="font-mono">{user.teamId}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs">These IDs cannot be changed here.</p>
          </div>
        )}

        <label className="block space-y-1">
          <span className="label-text">New password (optional)</span>
          <input
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input-field"
          />
        </label>

        <label className="block space-y-1">
          <span className="label-text">Confirm new password</span>
          <input
            type="password"
            minLength={6}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="input-field"
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
