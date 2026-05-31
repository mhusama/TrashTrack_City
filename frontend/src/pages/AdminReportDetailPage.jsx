import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import { inferReportArea } from "../config/dhakaAreas.js";
import {
  formatSensitiveLocations,
  smellRiskLabel,
  wasteSpreadLabel,
} from "../config/reportRiskFields.js";
import { formatReportCategory } from "../config/reportCategories.js";
import { REPORT_STATUS_OPTIONS, STATUS_TABLE_STYLES } from "../config/reportStatus.js";
import AdminAssignTeamTable from "../components/AdminAssignTeamTable.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const [teamTableOpen, setTeamTableOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    reportsApi
      .get(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      const res = await reportsApi.updateStatus(id, status);
      setReport(res.data.report);
      toast.success("Report status updated");
      setStatusOpen(false);
    } catch {
      toast.error("Could not update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <p className="text-black">Loading report…</p>;
  }

  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">Report not found.</p>
        <Link to="/admin" className="link-inline mt-4 inline-block">
          Back to admin dashboard
        </Link>
      </div>
    );
  }

  const resident = report.reportedBy;
  const statusStyle = STATUS_TABLE_STYLES[report.status] || STATUS_TABLE_STYLES.open;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-6">
      <div className="absolute right-0 top-0 z-10 card max-w-xs p-4 text-sm">
        <h2 className="mb-2 font-semibold text-[#6b0f1a]">Resident credentials</h2>
        <ul className="space-y-1 text-black">
          <li>
            <span className="font-medium">Resident ID:</span>{" "}
            {resident?.residentId || "—"}
          </li>
          <li>
            <span className="font-medium">Name:</span> {resident?.name || "—"}
          </li>
          <li>
            <span className="font-medium">Email:</span> {resident?.email || "—"}
          </li>
          <li>
            <span className="font-medium">Phone:</span> {resident?.phone || "—"}
          </li>
        </ul>
      </div>

      <section className="card p-6 pr-6 lg:pr-72">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-4 text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← Back to dashboard
        </button>
        <h1 className="text-2xl font-bold text-black">{report.title}</h1>
        {report.reportId && (
          <p className="mt-1 font-mono text-sm text-[#6b0f1a]">Report ID: {report.reportId}</p>
        )}
        <p className={`mt-2 inline-block rounded px-2 py-0.5 text-sm ${statusStyle.textClass}`}>
          {statusStyle.label}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="label-text">Category</p>
            <p className="mt-1 text-black">
              {formatReportCategory(report.category, report.subcategory)}
            </p>
          </div>
          <div>
            <p className="label-text">Area</p>
            <p className="mt-1 text-black">{inferReportArea(report)}</p>
          </div>
          <div>
            <p className="label-text">Issued date</p>
            <p className="mt-1 text-black">
              {new Date(report.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="label-text">Location</p>
            <p className="mt-1 text-black">
              {report.location.address ||
                `${report.location.lat.toFixed(5)}, ${report.location.lng.toFixed(5)}`}
            </p>
          </div>
          {report.location.nearbyLandmark && (
            <div>
              <p className="label-text">Nearby landmark</p>
              <p className="mt-1 text-black">{report.location.nearbyLandmark}</p>
            </div>
          )}
          {report.smellRisk && (
            <div>
              <p className="label-text">Smell/Health risk</p>
              <p className="mt-1 text-black">{smellRiskLabel(report.smellRisk)}</p>
            </div>
          )}
          {report.wasteSpreadArea && (
            <div>
              <p className="label-text">Waste spread area</p>
              <p className="mt-1 text-black">{wasteSpreadLabel(report.wasteSpreadArea)}</p>
            </div>
          )}
          <div>
            <p className="label-text">Near sensitive locations</p>
            <p className="mt-1 text-black">
              {formatSensitiveLocations(report.sensitiveLocations)}
            </p>
          </div>
        </div>

        {report.description && (
          <div className="mt-4">
            <p className="label-text">Description</p>
            <p className="mt-1 text-black">{report.description}</p>
          </div>
        )}

        {report.photoUrl && (
          <img
            src={mediaUrl(report.photoUrl)}
            alt="Report"
            className="mt-4 max-h-64 rounded-lg border border-theme-border object-cover"
          />
        )}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base font-bold text-black">Assign</span>
          <button
            type="button"
            onClick={() => setTeamTableOpen((v) => !v)}
            className="btn-primary px-6 py-2"
          >
            Team
          </button>
        </div>
        <p className="mt-2 text-sm text-black">
          {report.assignedTeam &&
          report.crewStatus &&
          report.crewStatus !== "unassigned" &&
          report.status !== "rejected" ? (
            <>
              Currently assigned to{" "}
              <strong>{report.assignedTeamDisplay || report.assignedTeam}</strong>.
            </>
          ) : (
            "This report has not been assigned to any team yet"
          )}
        </p>
        {teamTableOpen && (
          <div className="mt-4">
            <AdminAssignTeamTable
              reportId={report._id}
              assignedTeam={
                report.status === "rejected" || report.crewStatus === "unassigned"
                  ? ""
                  : report.assignedTeam
              }
              assignedTeamDisplay={
                report.status === "rejected" || report.crewStatus === "unassigned"
                  ? ""
                  : report.assignedTeamDisplay || ""
              }
              onAssigned={(updated) => setReport(updated)}
            />
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="relative inline-block">
          <button
            type="button"
            disabled={updating}
            onClick={() => setStatusOpen((v) => !v)}
            className="btn-primary px-6 py-3"
          >
            Report Status
          </button>
          {statusOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[200px] rounded-lg border border-theme-border bg-white py-1 shadow-lg">
              {REPORT_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusChange(opt.value)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#6b0f1a] hover:text-white ${
                    report.status === opt.value ? "bg-[#fce1ee] font-semibold" : "text-black"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
