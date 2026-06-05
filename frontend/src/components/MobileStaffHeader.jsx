import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { homePathForRole, roleLabel } from "../config/roles.js";

export default function MobileStaffHeader({ user, logout, crewSubRoleLabel }) {
  const dashboardPath = homePathForRole(user.role, user.crewSubRole);
  const roleText = crewSubRoleLabel
    ? `${roleLabel(user.role)} · ${crewSubRoleLabel}`
    : roleLabel(user.role);

  return (
    <div className="mobile-staff-header">
      <Link to={dashboardPath} className="mobile-header-logo mobile-staff-header-logo" aria-label="Trash Track City home">
        <img src="/logo.png" alt="Trash Track City" />
      </Link>
      <div className="mobile-staff-header-meta">
        <span className="mobile-staff-header-name">{user.name}</span>
        <span className="mobile-staff-header-role">{roleText}</span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="mobile-staff-header-logout"
        aria-label="Log out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}
