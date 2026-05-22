import { Link, NavLink, Outlet } from "react-router-dom";
import { MapPin, LogOut, Trash2, PlusCircle, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? "bg-brand-600/20 text-brand-100"
      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-brand-100">
            <Trash2 className="h-6 w-6 text-brand-500" />
            TrashTrack City
          </Link>

          {user && (
            <nav className="flex flex-wrap items-center gap-1">
              <NavLink to="/" end className={navClass}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink to="/map" className={navClass}>
                <MapPin className="h-4 w-4" />
                Map
              </NavLink>
              <NavLink to="/reports/new" className={navClass}>
                <PlusCircle className="h-4 w-4" />
                New report
              </NavLink>
            </nav>
          )}

          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="hidden text-slate-400 sm:inline">
                  {user.name}
                  <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-xs">
                    {user.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
              >
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
