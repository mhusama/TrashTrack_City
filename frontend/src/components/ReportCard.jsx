import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";

const statusColors = {
  open: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  resolved: "bg-brand-500/20 text-brand-100",
};

export default function ReportCard({ report, onStatusChange, isAdmin }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-100">{report.title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[report.status]}`}
        >
          {report.status.replace("_", " ")}
        </span>
      </div>

      {report.description && (
        <p className="mt-2 text-sm text-slate-400">{report.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1 capitalize">
          {report.category.replace("_", " ")}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </div>

      {report.photoUrl && (
        <img
          src={report.photoUrl}
          alt=""
          className="mt-3 h-32 w-full rounded-lg object-cover"
        />
      )}

      {isAdmin && report.status !== "resolved" && (
        <div className="mt-3 flex gap-2">
          {report.status === "open" && (
            <button
              type="button"
              onClick={() => onStatusChange(report._id, "in_progress")}
              className="rounded-lg bg-blue-600/80 px-3 py-1 text-xs text-white hover:bg-blue-600"
            >
              Mark in progress
            </button>
          )}
          <button
            type="button"
            onClick={() => onStatusChange(report._id, "resolved")}
            className="rounded-lg bg-brand-600 px-3 py-1 text-xs text-white hover:bg-brand-700"
          >
            Resolve
          </button>
        </div>
      )}
    </motion.article>
  );
}
