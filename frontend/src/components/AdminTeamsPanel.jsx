import { useState } from "react";
import AdminTeamLocationsTable from "./AdminTeamLocationsTable.jsx";
import AdminTeamsTable from "./AdminTeamsTable.jsx";

const VIEWS = {
  statistics: "statistics",
  locations: "locations",
};

function TeamsViewToggle({ activeView, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(VIEWS.statistics)}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          activeView === VIEWS.statistics
            ? "border-[#6b0f1a] bg-[#6b0f1a] text-white"
            : "border-theme-border bg-white text-black hover:bg-[#fce1ee]"
        }`}
      >
        Team statistics
      </button>
      <button
        type="button"
        onClick={() => onChange(VIEWS.locations)}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          activeView === VIEWS.locations
            ? "border-[#6b0f1a] bg-[#6b0f1a] text-white"
            : "border-theme-border bg-white text-black hover:bg-[#fce1ee]"
        }`}
      >
        Team locations
      </button>
    </div>
  );
}

export default function AdminTeamsPanel() {
  const [activeView, setActiveView] = useState(VIEWS.statistics);

  return (
    <div className="space-y-4">
      <TeamsViewToggle activeView={activeView} onChange={setActiveView} />
      {activeView === VIEWS.statistics ? (
        <AdminTeamsTable />
      ) : (
        <AdminTeamLocationsTable />
      )}
    </div>
  );
}
