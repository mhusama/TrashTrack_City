import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { crewApi, leadershipChatApi, teamChatApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import CrewSidebar from "../components/CrewSidebar.jsx";
import CrewStatusMap from "../components/CrewStatusMap.jsx";
import CrewTaskReportsTable from "../components/CrewTaskReportsTable.jsx";
import CrewTeamPanel from "../components/CrewTeamPanel.jsx";
import CrewChatPanel from "../components/CrewChatPanel.jsx";
import WelcomeHeader from "../components/WelcomeHeader.jsx";
import StatisticsPanel from "../components/statistics/StatisticsPanel.jsx";

export default function TeamLeaderDashboardPage() {
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

  const activeCount = reports.filter(
    (r) => r.crewStatus === "assigned" || r.crewStatus === "disposal_in_progress"
  ).length;

  return (
    <div className="admin-dashboard-layout text-black">
      <CrewSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        teamLabel="Your Team"
        showLeadershipChat
      />
      <div className="admin-dashboard-main space-y-6">
        {activeView === "dashboard" && (
          <>
            <WelcomeHeader
              name={user?.name}
              subtitle={
                <>
                  Team Leader · <strong>{user?.teamDisplayLabel || user?.teamName}</strong> — {activeCount}{" "}
                  active assignment{activeCount !== 1 ? "s" : ""}.
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
            <h2 className="mb-4 text-lg font-semibold">Your Team</h2>
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
                detailBasePath="/crew/leader/reports"
                enableLeaderTransport
                onReportsUpdate={loadReports}
              />
            )}
          </section>
        )}
        {activeView === "team-chat" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Chat with your team</h2>
            <p className="mb-4 text-sm text-black/70">
              Private chat for {user?.teamDisplayLabel || user?.teamName} only.
            </p>
            <CrewChatPanel api={teamChatApi} />
          </section>
        )}
        {activeView === "chat" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Chat with all teams</h2>
            <CrewChatPanel />
          </section>
        )}
        {activeView === "leadership-chat" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Chat with Admins and Leaders</h2>
            <CrewChatPanel api={leadershipChatApi} />
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
