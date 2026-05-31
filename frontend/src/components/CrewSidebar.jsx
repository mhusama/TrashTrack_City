import DashboardProfileLink from "./DashboardProfileLink.jsx";

export default function CrewSidebar({ activeView, onViewChange, teamLabel = "My Team" }) {
  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "team", label: teamLabel },
    { id: "map", label: "Map" },
    { id: "tasks", label: "Task Reports" },
    { id: "chat", label: "Chat with the Teams" },
  ];

  const statisticsItem = { id: "statistics", label: "Statistics" };

  return (
    <aside className="admin-sidebar card shrink-0 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b0f1a]">
        Index
      </p>
      <nav className="admin-sidebar-nav" aria-label="Crew dashboard sections">
        <ul className="space-y-1">
          {items.map((item) => (
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
              onClick={() => onViewChange(statisticsItem.id)}
              className={`admin-sidebar-link w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeView === statisticsItem.id
                  ? "border-[#6b0f1a] bg-[#6b0f1a] text-white"
                  : "border-[#fce1ee] text-black hover:bg-[#fce1ee]"
              }`}
            >
              {statisticsItem.label}
            </button>
          </li>
          <DashboardProfileLink />
        </ul>
      </nav>
    </aside>
  );
}
