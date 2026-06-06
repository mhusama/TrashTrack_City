import DashboardProfileLink from "./DashboardProfileLink.jsx";

const MEMBER_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "team", labelKey: "team" },
  { id: "map", label: "Map" },
  { id: "tasks", label: "Task Reports" },
  { id: "team-chat", label: "Chat with your team" },
  { id: "chat", label: "Chat with all teams" },
  { id: "community-feed", label: "Community Feed" },
];

const LEADER_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "Task Reports" },
  { id: "team", labelKey: "team" },
  { id: "team-chat", label: "Chat with your team" },
  { id: "map", label: "Map" },
  { id: "chat", label: "Chat with All Teams" },
  { id: "leadership-chat", label: "Chat with Admins and Leaders" },
  { id: "community-feed", label: "Community Feed" },
  { id: "statistics", label: "Statistics" },
];

function resolveLabel(item, teamLabel) {
  if (item.labelKey === "team") return teamLabel;
  return item.label;
}

export default function CrewSidebar({
  activeView,
  onViewChange,
  teamLabel = "My Team",
  variant = "team-member",
}) {
  const isLeader = variant === "team-leader";
  const items = isLeader ? LEADER_NAV_ITEMS : MEMBER_NAV_ITEMS;
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
                {resolveLabel(item, teamLabel)}
              </button>
            </li>
          ))}
          {!isLeader && (
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
          )}
          <DashboardProfileLink />
        </ul>
      </nav>
    </aside>
  );
}
