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
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold text-black">Dhaka city map</h1>
      <p className="text-black">
        Waste reports across Dhaka city. Hover for address details; click markers for reports.
      </p>
      {loading ? (
        <p className="text-black">Loading…</p>
      ) : (
        <ReportsMap reports={reports} height="520px" />
      )}
    </div>
  );
}
