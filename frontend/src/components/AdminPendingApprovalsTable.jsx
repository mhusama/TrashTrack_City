import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { teamsApi } from "../api/client.js";

export default function AdminPendingApprovalsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    teamsApi
      .pendingApprovals()
      .then((res) => setRows(res.data.reports))
      .catch(() => toast.error("Failed to load pending approvals"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <p>Loading…</p>;
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-theme-border p-8 text-center">
        No reports awaiting approval.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-theme-border">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-theme-border bg-[#fce1ee]">
            <th className="px-4 py-3 font-semibold">Report Title</th>
            <th className="px-4 py-3 font-semibold">Team name</th>
            <th className="px-4 py-3 font-semibold">Team Leader</th>
            <th className="px-4 py-3 font-semibold">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-b border-theme-border">
              <td className="px-4 py-3">
                <Link
                  to={`/admin/pending/${row._id}`}
                  className="font-medium text-[#6b0f1a] hover:underline"
                >
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-3">{row.teamName}</td>
              <td className="px-4 py-3">{row.teamLeader}</td>
              <td className="px-4 py-3 font-semibold">
                {row.remarks === "Approved" ? (
                  <span className="text-green-600">Approved</span>
                ) : (
                  <span className="text-red-600">Not Approved</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
