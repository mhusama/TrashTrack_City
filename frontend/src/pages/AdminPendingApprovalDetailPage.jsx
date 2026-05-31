import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { reportsApi, teamsApi } from "../api/client.js";
import { formatReportCategory } from "../config/reportCategories.js";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function AdminPendingApprovalDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    reportsApi
      .get(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApproval = async (approval) => {
    setUpdating(true);
    try {
      const res = await teamsApi.setApproval(id, approval);
      setReport(res.data.report);
      toast.success(approval === "approved" ? "Report approved" : "Marked not approved");
      setApprovalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update approval");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p>Report not found.</p>
        <Link to="/admin" className="link-inline mt-4 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const updated = report.updatedTaskReport || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Link to="/admin" className="text-sm font-medium text-[#6b0f1a] hover:underline">
        ← Back to dashboard (Pending Approvals)
      </Link>

      <section className="card p-6">
        <h1 className="text-2xl font-bold">{report.title}</h1>
        {report.reportId && (
          <p className="mt-1 font-mono text-sm text-[#6b0f1a]">Report ID: {report.reportId}</p>
        )}
        <p className="mt-2 text-sm">
          Team: <strong>{report.assignedTeam}</strong> · Crew status:{" "}
          <strong>{report.crewStatus}</strong>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="label-text">Category</p>
            <p>{formatReportCategory(report.category, report.subcategory)}</p>
          </div>
          <div>
            <p className="label-text">Issued date</p>
            <p>
              {new Date(report.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        {report.photoUrl && (
          <img
            src={mediaUrl(report.photoUrl)}
            alt="Original report"
            className="mt-4 max-h-48 rounded-lg border object-cover"
          />
        )}
      </section>

      {updated.submittedAt && (
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Updated Task Report (Team Leader)</h2>
          <p className="text-sm text-black">
            <span className="font-medium">Report ID:</span> {report.reportId} ·{" "}
            <span className="font-medium">Title:</span> {report.title}
          </p>
          <p className="mt-3 label-text">Description</p>
          <p className="mt-1">{updated.description}</p>
          {updated.imageUrl && (
            <img
              src={mediaUrl(updated.imageUrl)}
              alt="Updated task"
              className="mt-4 max-h-64 rounded-lg border object-cover"
            />
          )}
          <p className="mt-3 text-sm">
            <span className="font-medium">Update date:</span> {updated.updateDate}
          </p>
        </section>
      )}

      <section className="card p-6">
        <div className="relative inline-block">
          <span className="mr-3 font-bold text-black">Report Status</span>
          <button
            type="button"
            disabled={updating}
            onClick={() => setApprovalOpen((v) => !v)}
            className="btn-primary px-6 py-3"
          >
            Approved
          </button>
          {approvalOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[200px] rounded-lg border border-theme-border bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleApproval("approved")}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[#6b0f1a] hover:text-white"
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => handleApproval("not_approved")}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[#6b0f1a] hover:text-white"
              >
                Not Approved
              </button>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm">
          Current remark:{" "}
          <strong>
            {report.approvalRemark === "approved" ? "Approved" : "Not Approved"}
          </strong>
        </p>
      </section>
    </motion.div>
  );
}
