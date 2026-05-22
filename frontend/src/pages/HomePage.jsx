import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReportCard from "../components/ReportCard.jsx";
import ReportsMap from "../components/ReportsMap.jsx";

export default function HomePage() {
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

  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6"
      >
        <h1 className="text-2xl font-bold text-slate-50">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-2 text-slate-400">
          Track and report waste issues across your city.{" "}
          <span className="text-brand-100">{openCount} open</span> report
          {openCount !== 1 ? "s" : ""} right now.
        </p>
      </motion.div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent on map</h2>
        {loading ? (
          <p className="text-slate-500">Loading map…</p>
        ) : (
          <ReportsMap reports={reports} height="280px" />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Your reports</h2>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
            No reports yet. Create one from the New report page.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                isAdmin={user?.role === "admin"}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
