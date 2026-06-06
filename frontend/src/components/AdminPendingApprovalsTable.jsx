import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { teamsApi } from "../api/client.js";

const FILTER_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function StatusFilterDropdown({ filterMode, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const activeLabel = FILTER_OPTIONS.find((o) => o.value === filterMode)?.label || "Pending";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sort-by-trigger flex items-center gap-2 rounded-lg border border-theme-border bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
      >
        Status
        <span className="text-xs font-normal opacity-80">({activeLabel})</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1090] cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-[1100] mt-1 min-w-[200px] rounded-lg border border-theme-border bg-white py-1 shadow-lg">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onFilterChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                  filterMode === option.value ? "bg-[#6b0f1a] text-white" : "text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPendingApprovalsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("pending");

  const load = () => {
    setLoading(true);
    teamsApi
      .pendingApprovals(filterMode)
      .then((res) => setRows(res.data.reports))
      .catch(() => toast.error("Failed to load updated task reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [filterMode]);

  const emptyMessage =
    filterMode === "approved"
      ? "No approved updated task reports."
      : filterMode === "rejected"
        ? "No rejected reports with updated task reports."
        : "No pending updated task reports.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-black">Filter</span>
        <StatusFilterDropdown filterMode={filterMode} onFilterChange={setFilterMode} />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border p-8 text-center">
          {emptyMessage}
        </p>
      ) : (
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
                    ) : row.remarks === "Rejected" ? (
                      <span className="text-blue-600">Rejected</span>
                    ) : (
                      <span className="text-red-600">Not Approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
