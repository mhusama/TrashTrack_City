import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, LayoutDashboard, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole, roleLabel } from "../config/roles.js";
import { mediaUrl } from "../utils/mediaUrl.js";

const navClass = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export default function Layout() {
  const { user, logout } = useAuth();
  const dashboardPath = user ? homePathForRole(user.role) : "/";

  return (
    <div className="min-h-screen bg-white">
      <header className="site-navbar">
        <div className="header-bar grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link to={dashboardPath} className="logo-link justify-self-start" aria-label="Trash Track City home">
            <img src="/logo.png" alt="Trash Track City" className="header-logo" />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-1 justify-self-center">
            {user ? (
              <>
                {user.role === "cleaning_crew" && (
                  <NavLink to="/crew" className={navClass}>
                    <LayoutDashboard />
                    Dashboard
                  </NavLink>
                )}
              </>
            ) : (
              <span className="header-nav-title header-guest-brand">TrashTrack City</span>
            )}
          </nav>

          <div className="header-actions flex items-center justify-end gap-3 text-black justify-self-end">
            {user ? (
              <>
                {user.profilePicture ? (
                  <img
                    src={mediaUrl(user.profilePicture)}
                    alt=""
                    className="hidden h-9 w-9 rounded-full border border-theme-border object-cover sm:block"
                  />
                ) : null}
                <span className="header-username hidden font-bold sm:inline">{user.name}</span>
                <span className="header-box">{roleLabel(user.role)}</span>
                <button type="button" onClick={logout} className="header-box header-logout-btn">
                  <LogOut style={{ width: "1em", height: "1em" }} />
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="guest-cta-btn header-btn">
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main
        className={`mx-auto px-4 py-8 text-black ${
          user?.role === "admin" || user?.role === "resident"
            ? "max-w-[90rem]"
            : "max-w-6xl"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
