import { motion } from "framer-motion";
import { MapPin, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatReportCategory } from "../config/reportCategories.js";
import { getDaysUnderReview, getResolvedTimestamp } from "../utils/reportFilters.js";

const statusStyles = {
  open: "border-theme-border bg-white text-black",
  in_progress: "border-theme-border bg-neutral-200 text-black",
  resolved: "border-theme-border bg-black text-white",
  rejected: "border-theme-border bg-[#c2f2ff] text-blue-700",
};

function formatResolvedDateTime(report) {
  const ts = getResolvedTimestamp(report);
  if (!ts) {
    return "—";
  }
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportCard({
  report,
  areaName,
  onStatusChange,
  isAdmin,
  variant = "default",
  now = new Date(),
}) {
  const daysUnderReview = getDaysUnderReview(report, now);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-black">{report.title}</h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[report.status]}`}
        >
          {report.status.replace("_", " ")}
        </span>
      </div>

      {variant === "under_review" && (
        <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#6b0f1a]">
          <AlertCircle className="h-4 w-4" />
          Under review for {daysUnderReview} day{daysUnderReview !== 1 ? "s" : ""}
        </p>
      )}

      {variant === "resolved" && (
        <p className="mt-2 flex items-center gap-1 text-sm text-black">
          <CheckCircle2 className="h-4 w-4 text-[#6b0f1a]" />
          Resolved: {formatResolvedDateTime(report)}
        </p>
      )}

      {report.description && (
        <p className="mt-2 text-sm text-black">{report.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-black">
        <span className="flex items-center gap-1">
          {formatReportCategory(report.category, report.subcategory)}
        </span>
        {areaName && (
          <span className="rounded border border-theme-border px-1.5 py-0.5 font-medium">
            {areaName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Issued {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </div>

      {report.photoUrl && (
        <img
          src={report.photoUrl}
          alt=""
          className="mt-3 h-32 w-full rounded-lg border border-theme-border object-cover"
        />
      )}

      {isAdmin && report.status !== "resolved" && (
        <div className="mt-3 flex gap-2">
          {report.status === "open" && (
            <button
              type="button"
              onClick={() => onStatusChange(report._id, "in_progress")}
              className="btn-outline px-3 py-1 text-xs"
            >
              Mark in progress
            </button>
          )}
          <button
            type="button"
            onClick={() => onStatusChange(report._id, "resolved")}
            className="btn-primary px-3 py-1 text-xs"
          >
            Resolve
          </button>
        </div>
      )}
    </motion.article>
  );
}
