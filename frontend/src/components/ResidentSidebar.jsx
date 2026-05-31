import DashboardProfileLink from "./DashboardProfileLink.jsx";

const RESIDENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "map", label: "Map" },
  { id: "reports", label: "My Reports" },
  { id: "new-report", label: "New Report" },
];

const STATISTICS_ITEM = { id: "statistics", label: "Statistics" };

export default function ResidentSidebar({ activeView, onViewChange }) {
  return (
    <aside className="admin-sidebar card shrink-0 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b0f1a]">
        Index
      </p>
      <nav aria-label="Resident dashboard sections">
        <ul className="space-y-1">
          {RESIDENT_NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`admin-sidebar-link w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? "border-[#6b0f1a] bg-[#6b0f1a] text-white"
                    : "border-[#fce1ee] text-black hover:bg-[#fce1ee]"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => onViewChange(STATISTICS_ITEM.id)}
              className={`admin-sidebar-link w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeView === STATISTICS_ITEM.id
                  ? "border-[#6b0f1a] bg-[#6b0f1a] text-white"
                  : "border-[#fce1ee] text-black hover:bg-[#fce1ee]"
              }`}
            >
              {STATISTICS_ITEM.label}
            </button>
          </li>
          <DashboardProfileLink />
        </ul>
      </nav>
    </aside>
  );
}
