import { Link } from "react-router-dom";
import { sortReportsByResidentThenDate, STATUS_TABLE_STYLES } from "../config/reportStatus.js";

export default function AdminReportsTable({ reports }) {
  const sorted = sortReportsByResidentThenDate(reports);

  return (
    <div className="overflow-x-auto rounded-xl border border-theme-border">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-theme-border bg-[#fce1ee]">
            <th className="px-4 py-3 font-semibold text-black">Resident ID</th>
            <th className="px-4 py-3 font-semibold text-black">Report ID</th>
            <th className="px-4 py-3 font-semibold text-black">Report</th>
            <th className="px-4 py-3 font-semibold text-black">Issued Date</th>
            <th className="px-4 py-3 font-semibold text-black">Assigned To</th>
            <th className="px-4 py-3 font-semibold text-black">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((report) => {
            const style = STATUS_TABLE_STYLES[report.status] || STATUS_TABLE_STYLES.open;
            const residentId = report.reportedBy?.residentId || "—";
            const assigned =
              report.assignedTeamDisplay ||
              (report.assignedTeam &&
              report.crewStatus !== "unassigned" &&
              report.status !== "rejected"
                ? report.assignedTeam
                : "");
            return (
              <tr
                key={report._id}
                className="border-b border-theme-border transition-opacity hover:opacity-90"
                style={{ backgroundColor: style.rowBg }}
              >
                <td className="px-4 py-3 font-mono text-xs text-black">{residentId}</td>
                <td className="px-4 py-3 font-mono text-xs">{report.reportId || "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/reports/${report._id}`}
                    className="font-medium text-black underline-offset-2 hover:underline"
                  >
                    {report.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-black">
                  {new Date(report.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-black">{assigned || "—"}</td>
                <td className={`px-4 py-3 ${style.textClass}`}>{style.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
