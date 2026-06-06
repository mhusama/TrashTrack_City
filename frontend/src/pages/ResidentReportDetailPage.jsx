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
import { STATUS_TABLE_STYLES } from "../config/reportStatus.js";
import ReportPhoto from "../components/ReportPhoto.jsx";
import { canResidentModifyReport } from "../utils/reportActions.js";
import ReportManageActions from "../components/ReportManageActions.jsx";

export default function ResidentReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    reportsApi
      .get(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-black">Loading report…</p>;
  }

  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">Report not found.</p>
        <Link to="/" className="link-inline mt-4 inline-block">
          Back to My Reports
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_TABLE_STYLES[report.status] || STATUS_TABLE_STYLES.open;
  const canModify = canResidentModifyReport(report);

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete report "${report.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await reportsApi.remove(id);
      toast.success("Report deleted");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete report");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <section className="card p-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← Back to My Reports
        </button>
        <h1 className="text-2xl font-bold text-black">{report.title}</h1>
        {report.reportId && (
          <p className="mt-1 font-mono text-sm text-[#6b0f1a]">Report ID: {report.reportId}</p>
        )}
        <p className={`mt-2 inline-block rounded px-2 py-0.5 text-sm ${statusStyle.textClass}`}>
          {statusStyle.label}
        </p>

        {canModify && (
          <ReportManageActions
            reportId={report._id}
            deleting={deleting}
            onDelete={handleDelete}
            className="mt-4 max-w-md"
          />
        )}

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

        <ReportPhoto
          src={report.photoUrl}
          className="mt-4 max-h-64 w-full rounded-lg border border-theme-border object-cover"
        />
      </section>
    </motion.div>
  );
}
