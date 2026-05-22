import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import ReportsMap from "../components/ReportsMap.jsx";

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .list()
      .then((res) => setReports(res.data.reports))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">City map</h1>
      <p className="text-slate-400">
        All reported waste locations. Click markers for details.
      </p>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <ReportsMap reports={reports} height="520px" />
      )}
    </div>
  );
}
