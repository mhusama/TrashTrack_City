import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { crewApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import CrewSidebar from "../components/CrewSidebar.jsx";
import CrewStatusMap from "../components/CrewStatusMap.jsx";
import CrewTaskReportsTable from "../components/CrewTaskReportsTable.jsx";
import CrewTeamPanel from "../components/CrewTeamPanel.jsx";
import CrewChatPanel from "../components/CrewChatPanel.jsx";
import WelcomeHeader from "../components/WelcomeHeader.jsx";
import StatisticsPanel from "../components/statistics/StatisticsPanel.jsx";

export default function TeamMemberDashboardPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [reports, setReports] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReports = () => {
    crewApi
      .reports()
      .then((res) => setReports(res.data.reports))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  };

  const loadTeam = () => {
    crewApi
      .myTeam()
      .then((res) => setTeamData(res.data))
      .catch(() => toast.error("Failed to load team"));
  };

  useEffect(() => {
    loadReports();
    loadTeam();
    const timer = setInterval(loadReports, 20_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="admin-dashboard-layout text-black">
      <CrewSidebar activeView={activeView} onViewChange={setActiveView} teamLabel="My Team" />
      <div className="admin-dashboard-main space-y-6">
        {activeView === "dashboard" && (
          <>
            <WelcomeHeader
              name={user?.name}
              subtitle={
                <>
                  Team Member · <strong>{user?.teamDisplayLabel || user?.teamName}</strong> — view-only task updates.
                </>
              }
            />
            <button
              type="button"
              onClick={() => setActiveView("tasks")}
              className="guest-cta-btn px-6 py-3"
            >
              Task Reports
            </button>
          </>
        )}
        {activeView === "team" && (
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">My Team</h2>
            <CrewTeamPanel teamData={teamData} loading={!teamData} />
          </section>
        )}
        {activeView === "map" && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Assigned locations map</h2>
            {loading ? (
              <p>Loading map…</p>
            ) : (
              <CrewStatusMap reports={reports} height="70vh" className="admin-status-map" />
            )}
          </section>
        )}
        {activeView === "tasks" && (
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Task Reports</h2>
            {loading ? (
              <p>Loading…</p>
            ) : (
              <CrewTaskReportsTable
                reports={reports}
                detailBasePath="/crew/member/reports"
                assignedTransportReadOnly
              />
            )}
          </section>
        )}
        {activeView === "chat" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Chat with the Teams</h2>
            <CrewChatPanel />
          </section>
        )}
        {activeView === "statistics" && (
          <section className="card p-6">
            <StatisticsPanel title="City Statistics" />
          </section>
        )}
      </div>
    </div>
  );
}
