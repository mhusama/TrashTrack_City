import { Link } from "react-router-dom";

export default function ReportManageActions({
  reportId,
  onDelete,
  deleting = false,
  className = "",
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Link
        to={`/reports/${reportId}/edit`}
        className="flex-1 rounded-lg border border-[#6b0f1a] py-2 text-center text-sm font-medium text-[#6b0f1a] transition-colors hover:bg-[#fce1ee]"
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={deleting}
        onClick={onDelete}
        className="flex-1 rounded-lg border border-red-600 py-2 text-center text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
