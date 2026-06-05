import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useResidentNav } from "../context/ResidentNavContext.jsx";
import {
  BarChart3,
  Bell,
  Home,
  Map,
  Menu,
  MessageSquare,
  PlusCircle,
  User,
  X,
} from "lucide-react";

const PRIMARY_ITEMS = [
  { id: "dashboard", label: "Home", icon: Home, to: "/", state: {} },
  { id: "map", label: "Map", icon: Map, to: "/", state: { view: "map" } },
  {
    id: "reports",
    label: "Reports",
    icon: MessageSquare,
    to: "/",
    state: { view: "reports", openReports: true },
  },
  { id: "new-report", label: "Report", icon: PlusCircle, to: "/reports/new" },
];

const MORE_ITEMS = [
  { id: "community-feed", label: "Community Feed", to: "/", state: { view: "community-feed" } },
  { id: "statistics", label: "Statistics", to: "/", state: { view: "statistics" } },
  { id: "profile", label: "Edit Profile", to: "/profile" },
  { id: "notifications", label: "Notifications", to: "/notifications" },
];

function isItemActive(item, pathname, homeView) {
  if (item.to === "/reports/new") return pathname === "/reports/new";
  if (item.to === "/profile") return pathname === "/profile";
  if (item.to === "/notifications") return pathname === "/notifications";
  if (pathname.startsWith("/reports/")) {
    return item.id === "reports";
  }
  if (pathname !== "/") return false;
  if (item.id === "dashboard") return !homeView || homeView === "dashboard";
  return homeView === item.id;
}

export default function MobileResidentNav() {
  const location = useLocation();
  const { homeView } = useResidentNav();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((item) => isItemActive(item, location.pathname, homeView));

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          className="mobile-resident-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="mobile-resident-more-sheet" role="dialog" aria-label="More options">
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
            {MORE_ITEMS.map((item) => {
              const active = isItemActive(item, location.pathname, homeView);
              const Icon =
                item.id === "statistics"
                  ? BarChart3
                  : item.id === "notifications"
                    ? Bell
                    : item.id === "profile"
                      ? User
                      : MessageSquare;
              return (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    state={item.state}
                    onClick={() => setMoreOpen(false)}
                    className={`mobile-resident-more-link ${active ? "mobile-resident-more-link-active" : ""}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <nav className="mobile-resident-nav" aria-label="Resident navigation">
        {PRIMARY_ITEMS.map((item) => {
          const active = isItemActive(item, location.pathname, homeView);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              state={item.state}
              className={`mobile-resident-nav-item ${active ? "mobile-resident-nav-item-active" : ""}`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`mobile-resident-nav-item ${moreActive || moreOpen ? "mobile-resident-nav-item-active" : ""}`}
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
