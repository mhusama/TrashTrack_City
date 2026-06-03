import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi, leadershipChatApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdminReportsTable from "../components/AdminReportsTable.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminStatusMap from "../components/AdminStatusMap.jsx";
import AdminTeamsTable from "../components/AdminTeamsTable.jsx";
import AdminPendingApprovalsTable from "../components/AdminPendingApprovalsTable.jsx";
import WelcomeHeader from "../components/WelcomeHeader.jsx";
import StatisticsPanel from "../components/statistics/StatisticsPanel.jsx";
import CrewChatPanel from "../components/CrewChatPanel.jsx";
import AdminTableFilters, { ADMIN_STATUS_LABELS } from "../components/AdminTableFilters.jsx";
import { inferReportArea } from "../config/dhakaAreas.js";

function tableHeading(areaFilter, statusFilter) {
  if (areaFilter === "all" && statusFilter === "all") {
    return "All reports";
  }
  const parts = [];
  if (statusFilter !== "all") {
    parts.push(ADMIN_STATUS_LABELS[statusFilter]);
  }
  if (areaFilter !== "all") {
    parts.push(`in ${areaFilter}`);
  }
  return `${parts.join(" ")} reports`;
}

function ReportsSection({
  loading,
  reports,
  filteredReports,
  areaFilter,
  statusFilter,
  onAreaChange,
  onStatusChange,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <AdminTableFilters
        areaFilter={areaFilter}
        statusFilter={statusFilter}
        onAreaChange={onAreaChange}
        onStatusChange={onStatusChange}
      />
      <h2 className="mb-4 text-lg font-semibold text-black">
        {tableHeading(areaFilter, statusFilter)}
      </h2>
      {loading ? (
        <p>Loading table…</p>
      ) : reports.length === 0 ? (
        <p className="text-center text-black">No reports yet.</p>
      ) : filteredReports.length === 0 ? (
        <p className="text-center text-black">No reports match these filters.</p>
      ) : (
        <AdminReportsTable reports={filteredReports} />
      )}
    </motion.section>
  );
}

function MapSection({ loading, reports, mapHeight, fullHeight = false }) {
  return (
    <section
      className={`dashboard-map-section relative z-0 ${
        fullHeight ? "admin-dashboard-map-section admin-dashboard-map-section--solo" : ""
      }`}
    >
      <h2 className="mb-3 shrink-0 text-lg font-semibold text-black">Centralized Map View</h2>
      {loading ? (
        <p className="text-black">Loading map…</p>
      ) : (
        <AdminStatusMap reports={reports} height={mapHeight} className="admin-status-map" />
      )}
    </section>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadReports = () => {
    reportsApi
      .list()
      .then((res) => setReports(res.data.reports))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
    const timer = setInterval(loadReports, 30_000);
    return () => clearInterval(timer);
  }, []);

  const pendingCount = reports.filter((r) => r.status === "open").length;

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const areaMatch = areaFilter === "all" || inferReportArea(report) === areaFilter;
      const statusMatch = statusFilter === "all" || report.status === statusFilter;
      return areaMatch && statusMatch;
    });
  }, [reports, areaFilter, statusFilter]);

  const showOverview = activeView === "dashboard";
  const showMap = activeView === "dashboard" || activeView === "map";
  const showReports = showReportsPanel && (activeView === "dashboard" || activeView === "reports");
  const showTeams = activeView === "teams";
  const showPending = activeView === "pending";
  const showStatistics = activeView === "statistics";
  const showLeadershipChat = activeView === "leadership-chat";
  const mapHeight = activeView === "map" ? "70vh" : "45vh";

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === "dashboard") {
      setShowReportsPanel(false);
    } else if (view === "reports") {
      setShowReportsPanel(true);
    } else {
      setShowReportsPanel(false);
    }
  };

  const openReportsPanel = () => {
    setShowReportsPanel(true);
  };

  return (
    <div className="admin-dashboard-layout text-black">
      <AdminSidebar activeView={activeView} onViewChange={handleViewChange} />

      <div className="admin-dashboard-main space-y-6">
        {showOverview && (
          <section className="dashboard-top relative isolate z-[1000] shrink-0">
            <WelcomeHeader
              name={user?.name}
              subtitle={
                <>
                  Municipal admin overview.{" "}
                  <span className="font-semibold">{pendingCount} pending</span> report
                  {pendingCount !== 1 ? "s" : ""} awaiting review.
                </>
              }
            />
          </section>
        )}

        {showOverview && !showReportsPanel && (
          <div>
            <button
              type="button"
              onClick={openReportsPanel}
              className="guest-cta-btn px-6 py-3"
            >
              View All Reports
            </button>
          </div>
        )}

        {showReports && (
          <ReportsSection
            loading={loading}
            reports={reports}
            filteredReports={filteredReports}
            areaFilter={areaFilter}
            statusFilter={statusFilter}
            onAreaChange={setAreaFilter}
            onStatusChange={setStatusFilter}
          />
        )}

        {showMap && (
          <MapSection
            loading={loading}
            reports={reports}
            mapHeight={mapHeight}
            fullHeight={activeView === "map"}
          />
        )}

        {showTeams && (
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-black">Teams</h2>
            <AdminTeamsTable />
          </section>
        )}

        {showPending && (
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-black">Pending Approvals</h2>
            <AdminPendingApprovalsTable />
          </section>
        )}

        {showStatistics && (
          <section className="card p-6">
            <StatisticsPanel title="City Statistics" />
          </section>
        )}

        {showLeadershipChat && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-black">
              Chat with Admins and Leaders
            </h2>
            <CrewChatPanel api={leadershipChatApi} />
          </section>
        )}
      </div>
    </div>
  );
}
