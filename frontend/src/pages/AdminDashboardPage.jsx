import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi, leadershipChatApi, teamsApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdminReportsTable from "../components/AdminReportsTable.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminStatusMap from "../components/AdminStatusMap.jsx";
import AdminTeamsTable from "../components/AdminTeamsTable.jsx";
import AdminPendingApprovalsTable from "../components/AdminPendingApprovalsTable.jsx";
import WelcomeHeader from "../components/WelcomeHeader.jsx";
import StatisticsPanel from "../components/statistics/StatisticsPanel.jsx";
import CrewChatPanel from "../components/CrewChatPanel.jsx";
import CommunityFeedPanel from "../components/CommunityFeedPanel.jsx";
import AdminResidentActivitiesTable from "../components/AdminResidentActivitiesTable.jsx";
import AdminTableFilters, { ADMIN_STATUS_LABELS } from "../components/AdminTableFilters.jsx";
import { inferReportArea } from "../config/dhakaAreas.js";
import useIsMobile from "../hooks/useIsMobile.js";
import useDashboardView from "../hooks/useDashboardView.js";

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
  sortOrder,
  onAreaChange,
  onStatusChange,
  onSortOrderChange,
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
        sortOrder={sortOrder}
        onAreaChange={onAreaChange}
        onStatusChange={onStatusChange}
        onSortOrderChange={onSortOrderChange}
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
  const location = useLocation();
  const isMobile = useIsMobile();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(() => location.state?.view || "dashboard");
  const [showReportsPanel, setShowReportsPanel] = useState(
    () => Boolean(location.state?.openReports || location.state?.view === "reports")
  );
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [pendingUpdatedTaskCount, setPendingUpdatedTaskCount] = useState(0);

  const loadReports = () => {
    reportsApi
      .list()
      .then((res) => setReports(res.data.reports))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  };

  const loadPendingUpdatedTasks = () => {
    teamsApi
      .pendingApprovals("pending")
      .then((res) => setPendingUpdatedTaskCount(res.data.reports?.length ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    loadReports();
    loadPendingUpdatedTasks();
    const timer = setInterval(() => {
      loadReports();
      loadPendingUpdatedTasks();
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const pendingCount = reports.filter((r) => r.status === "open").length;

  const filteredReports = useMemo(() => {
    const filtered = reports.filter((report) => {
      const areaMatch = areaFilter === "all" || inferReportArea(report) === areaFilter;
      const statusMatch = statusFilter === "all" || report.status === statusFilter;
      return areaMatch && statusMatch;
    });

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [reports, areaFilter, statusFilter, sortOrder]);

  const showOverview = activeView === "dashboard";
  const showMap = activeView === "dashboard" || activeView === "map";
  const showReports = showReportsPanel && (activeView === "dashboard" || activeView === "reports");
  const showTeams = activeView === "teams";
  const showPending = activeView === "pending";
  const showStatistics = activeView === "statistics";
  const showLeadershipChat = activeView === "leadership-chat";
  const showCommunityFeed = activeView === "community-feed";
  const showResidentActivities = activeView === "resident-activities";
  const mapHeight = activeView === "map" ? (isMobile ? "55vh" : "70vh") : isMobile ? "40vh" : "45vh";

  const handleViewChange = useCallback((view) => {
    setActiveView(view);
    if (view === "dashboard") {
      setShowReportsPanel(false);
    } else if (view === "reports") {
      setShowReportsPanel(true);
    } else {
      setShowReportsPanel(false);
    }
  }, []);

  useDashboardView({
    activeView,
    setActiveView,
    onViewChange: handleViewChange,
    extraStateHandlers: (view, state) => {
      if (view === "reports" || state?.openReports) {
        setShowReportsPanel(true);
      }
    },
  });

  const openReportsPanel = () => {
    setShowReportsPanel(true);
  };

  return (
    <div
      className={`admin-dashboard-layout text-black ${
        isMobile ? "admin-dashboard-layout--mobile" : ""
      }`}
    >
      {!isMobile && (
        <AdminSidebar activeView={activeView} onViewChange={handleViewChange} />
      )}

      <div className="admin-dashboard-main space-y-6">
        {showOverview && (
          <section className="dashboard-top relative isolate z-[1000] shrink-0">
            <WelcomeHeader
              name={user?.name}
              subtitle={
                <>
                  Municipal admin overview.{" "}
                  <span className="font-semibold">{pendingCount} pending</span> report
                  {pendingCount !== 1 ? "s" : ""} awaiting review
                  {" · "}
                  <span className="font-semibold">{pendingUpdatedTaskCount}</span> updated task
                  report{pendingUpdatedTaskCount !== 1 ? "s" : ""} pending review.
                </>
              }
            />
          </section>
        )}

        {showOverview && !showReportsPanel && !isMobile && (
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
            sortOrder={sortOrder}
            onAreaChange={setAreaFilter}
            onStatusChange={setStatusFilter}
            onSortOrderChange={setSortOrder}
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
            <h2 className="mb-4 text-lg font-semibold text-black">Updated Task Reports</h2>
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

        {showCommunityFeed && (
          <section className="card p-6">
            <CommunityFeedPanel />
          </section>
        )}

        {showResidentActivities && (
          <section className="card p-6">
            <h2 className="mb-2 text-lg font-semibold text-black">Resident Activities</h2>
            <p className="mb-4 text-sm text-black/70">
              Track reports and reviews from residents. Block users who post false reports or
              abusive reviews.
            </p>
            <AdminResidentActivitiesTable />
          </section>
        )}
      </div>
    </div>
  );
}
