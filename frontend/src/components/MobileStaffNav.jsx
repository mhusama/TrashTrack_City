import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useDashboardNav } from "../context/DashboardNavContext.jsx";
import {
  getStaffNavConfig,
  resolveStaffNavActive,
  staffDashboardPath,
} from "../config/mobileStaffNav.js";

export default function MobileStaffNav({ variant }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeView, onViewChange } = useDashboardNav();
  const [moreOpen, setMoreOpen] = useState(false);

  const basePath = staffDashboardPath(user?.role, user?.crewSubRole);
  const { primary, more } = getStaffNavConfig(variant);
  const isOnDashboard = location.pathname === basePath;

  const goToView = (viewId) => {
    setMoreOpen(false);
    if (isOnDashboard) {
      onViewChange(viewId);
      return;
    }
    navigate(basePath, { state: { view: viewId } });
  };

  const moreActive = more.some((item) =>
    resolveStaffNavActive(item, location.pathname, basePath, activeView)
  );

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          className="mobile-bottom-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="mobile-bottom-more-sheet" role="dialog" aria-label="More options">
          <div className="flex items-center justify-between border-b border-[#fce1ee] px-4 py-3">
            <p className="text-sm font-semibold text-[#6b0f1a]">More</p>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="rounded-lg p-1 text-black hover:bg-[#fce1ee]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="p-2">
            {more.map((item) => {
              const active = resolveStaffNavActive(
                item,
                location.pathname,
                basePath,
                activeView
              );
              const Icon = item.icon;
              if (item.route) {
                return (
                  <li key={item.id}>
                    <Link
                      to={item.route}
                      onClick={() => setMoreOpen(false)}
                      className={`mobile-bottom-more-link ${active ? "mobile-bottom-more-link-active" : ""}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => goToView(item.id)}
                    className={`mobile-bottom-more-link w-full ${active ? "mobile-bottom-more-link-active" : ""}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Dashboard navigation">
        {primary.map((item) => {
          const active = resolveStaffNavActive(
            item,
            location.pathname,
            basePath,
            activeView
          );
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goToView(item.id)}
              className={`mobile-bottom-nav-item ${active ? "mobile-bottom-nav-item-active" : ""}`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`mobile-bottom-nav-item ${moreActive || moreOpen ? "mobile-bottom-nav-item-active" : ""}`}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
        >
          <Menu className="h-5 w-5" strokeWidth={moreOpen ? 2.5 : 2} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
