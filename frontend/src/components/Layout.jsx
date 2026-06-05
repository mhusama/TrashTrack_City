import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole, roleLabel } from "../config/roles.js";
import { mediaUrl } from "../utils/mediaUrl.js";
import useIsMobile from "../hooks/useIsMobile.js";
import { ResidentNavProvider } from "../context/ResidentNavContext.jsx";
import MobileResidentNav from "./MobileResidentNav.jsx";

const navClass = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const dashboardPath = user ? homePathForRole(user.role) : "/";
  const isGuest = !user;
  const isResidentMobile = isMobile && user?.role === "resident";
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].includes(
    location.pathname
  );

  return (
    <div
      className={`min-h-screen bg-white ${isResidentMobile ? "mobile-resident-shell" : ""} ${
        isGuest && isMobile ? "mobile-guest-shell" : ""
      }`}
    >
      <header
        className={`site-navbar ${isGuest && isMobile ? "site-navbar--mobile-guest" : ""} ${
          isResidentMobile ? "site-navbar--mobile-resident" : ""
        }`}
      >
        {isGuest && isMobile ? (
          <div className="mobile-guest-header">
            <Link to="/" className="mobile-guest-header-logo" aria-label="Trash Track City home">
              <img src="/logo.png" alt="Trash Track City" />
            </Link>
            <span className="mobile-guest-header-title">TrashTrack City</span>
            <NavLink to="/login" className="mobile-guest-header-signin">
              Sign in
            </NavLink>
          </div>
        ) : isResidentMobile ? (
          <div className="mobile-resident-header">
            <Link to="/" className="mobile-resident-header-logo" aria-label="Trash Track City home">
              <img src="/logo.png" alt="Trash Track City" />
            </Link>
            <div className="mobile-resident-header-meta">
              <span className="mobile-resident-header-name">{user.name}</span>
              <span className="mobile-resident-header-role">{roleLabel(user.role)}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mobile-resident-header-logout"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="header-bar grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Link to={dashboardPath} className="logo-link justify-self-start" aria-label="Trash Track City home">
              <img src="/logo.png" alt="Trash Track City" className="header-logo" />
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-1 justify-self-center">
              {user ? (
                <>
                  {user.role === "cleaning_crew" && (
                    <NavLink to="/crew" className={navClass}>
                      Dashboard
                    </NavLink>
                  )}
                </>
              ) : (
                <span className="header-nav-title header-guest-brand text-2xl font-bold">TrashTrack City</span>
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
        )}
      </header>

      <ResidentNavProvider>
        <main
          className={`mx-auto px-4 text-black ${
            isResidentMobile
              ? "mobile-resident-main py-4"
              : isMobile && isAuthPage
                ? "py-3"
                : "py-8"
          } ${
            user?.role === "admin" || user?.role === "resident"
              ? "max-w-[90rem]"
              : "max-w-6xl"
          }`}
        >
          <Outlet />
        </main>

        {isResidentMobile && <MobileResidentNav />}
      </ResidentNavProvider>
    </div>
  );
}
