import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdminStatusMap from "../components/AdminStatusMap.jsx";
import ReportCard from "../components/ReportCard.jsx";
import ResidentSidebar from "../components/ResidentSidebar.jsx";
import SortByDropdown from "../components/SortByDropdown.jsx";
import WelcomeHeader from "../components/WelcomeHeader.jsx";
import StatisticsPanel from "../components/statistics/StatisticsPanel.jsx";
import NewReportPage from "./NewReportPage.jsx";
import { inferReportArea } from "../config/dhakaAreas.js";
import { filterReports, getFilterLabel } from "../utils/reportFilters.js";

function MyReportsPanel({
  loading,
  reports,
  filteredReports,
  sortMode,
  onSortChange,
  listVariant,
  now,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="dashboard-sort-slot relative z-[1000]">
        <SortByDropdown sortMode={sortMode} onSortChange={onSortChange} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-black">My Reports</h2>
        {sortMode.type !== "all" && (
          <p className="mt-1 text-sm font-medium text-[#6b0f1a]">
            {getFilterLabel(sortMode)} ({filteredReports.length} report
            {filteredReports.length !== 1 ? "s" : ""})
          </p>
        )}
      </div>
      {loading ? (
        <p className="text-black">Loading…</p>
      ) : filteredReports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
          {sortMode.type === "all"
            ? "No reports yet. Create one from New Report in the sidebar."
            : "No reports match this filter."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredReports.map((report) => (
            <Link
              key={report._id}
              to={`/reports/${report._id}`}
              className="block rounded-xl transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b0f1a]"
            >
              <ReportCard
                report={report}
                areaName={inferReportArea(report)}
                isAdmin={false}
                variant={listVariant}
                now={now}
              />
            </Link>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function MapPanel({ loading, reports }) {
  return (
    <section className="admin-dashboard-map-section admin-dashboard-map-section--solo dashboard-map-section relative z-0">
      <h2 className="mb-3 text-lg font-semibold text-black">My reports on map</h2>
      {loading ? (
        <p className="text-black">Loading map…</p>
      ) : reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
          No report locations yet. Submit a report to see markers on the map.
        </p>
      ) : (
        <AdminStatusMap reports={reports} height="70vh" className="admin-status-map" />
      )}
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [sortMode, setSortMode] = useState({ type: "all" });
  const [now, setNow] = useState(() => new Date());

  const loadReports = () => {
    reportsApi
      .list()
      .then((res) => setReports(res.data.reports))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
    const refreshTimer = setInterval(loadReports, 30_000);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const filteredReports = useMemo(
    () => filterReports(reports, sortMode, now),
    [reports, sortMode, now]
  );

  const openCount = reports.filter((r) => r.status === "open").length;
  const listVariant =
    sortMode.type === "resolved"
      ? "resolved"
      : sortMode.type === "under_review"
        ? "under_review"
        : "default";

  const showOverview = activeView === "dashboard";
  const showReports =
    showReportsPanel && (activeView === "dashboard" || activeView === "reports");
  const showMap = activeView === "map";
  const showStatistics = activeView === "statistics";
  const showNewReport = activeView === "new-report";

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === "dashboard") {
      setShowReportsPanel(false);
    } else if (view === "reports") {
      setShowReportsPanel(true);
    }
  };

  return (
    <div className="admin-dashboard-layout text-black">
      <ResidentSidebar activeView={activeView} onViewChange={handleViewChange} />

      <div className="admin-dashboard-main space-y-6">
        {showOverview && (
          <section className="dashboard-top relative isolate z-[1000] shrink-0">
            <WelcomeHeader
              name={user?.name}
              subtitle={
                <>
                  Track and report waste issues across Dhaka city.{" "}
                  <span className="font-semibold">{openCount} open</span> report
                  {openCount !== 1 ? "s" : ""} right now.
                </>
              }
            />
          </section>
        )}

        {showOverview && !showReportsPanel && (
          <div>
            <button
              type="button"
              onClick={() => setShowReportsPanel(true)}
              className="guest-cta-btn px-6 py-3"
            >
              My Reports
            </button>
          </div>
        )}

        {showReports && (
          <MyReportsPanel
            loading={loading}
            reports={reports}
            filteredReports={filteredReports}
            sortMode={sortMode}
            onSortChange={setSortMode}
            listVariant={listVariant}
            now={now}
          />
        )}

        {showMap && <MapPanel loading={loading} reports={reports} />}

        {showStatistics && (
          <section className="card p-6">
            <StatisticsPanel />
          </section>
        )}

        {showNewReport && (
          <section className="w-full min-w-0">
            <NewReportPage />
          </section>
        )}
      </div>
    </div>
  );
}
