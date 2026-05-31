import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReportCard from "../components/ReportCard.jsx";
import ReportsMap from "../components/ReportsMap.jsx";
import WelcomeHeader from "../components/WelcomeHeader.jsx";
import { inferReportArea } from "../config/dhakaAreas.js";

export default function CleaningCrewDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleStatusChange = async (id, status) => {
    try {
      await reportsApi.updateStatus(id, status);
      toast.success("Status updated");
      loadReports();
    } catch {
      toast.error("Could not update status");
    }
  };

  const activeReports = useMemo(
    () => reports.filter((r) => r.status === "open" || r.status === "in_progress"),
    [reports]
  );

  return (
    <div className="space-y-8 text-black">
      <section className="dashboard-top relative isolate z-[1000]">
        <WelcomeHeader
          name={user?.name}
          subtitle={
            <>
              Cleaning crew assignments across Dhaka.{" "}
              <span className="font-semibold">{activeReports.length} active</span> task
              {activeReports.length !== 1 ? "s" : ""} right now.
            </>
          }
        />
      </section>

      <section className="dashboard-map-section relative z-0">
        <h2 className="mb-3 text-lg font-semibold text-black">Active locations on Dhaka map</h2>
        {loading ? (
          <p className="text-black">Loading map…</p>
        ) : (
          <ReportsMap reports={activeReports} height="280px" />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-black">Assignments</h2>
        {loading ? (
          <p className="text-black">Loading…</p>
        ) : activeReports.length === 0 ? (
          <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
            No active assignments right now.
          </p>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {activeReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                areaName={inferReportArea(report)}
                isAdmin
                onStatusChange={handleStatusChange}
                variant="under_review"
              />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
