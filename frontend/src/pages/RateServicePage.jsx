import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { feedbackApi, reportsApi } from "../api/client.js";
import ReportPhotoPicker from "../components/ReportPhotoPicker.jsx";
import StarRating from "../components/StarRating.jsx";
import { formatReportCategory } from "../config/reportCategories.js";
import { mediaUrl } from "../utils/mediaUrl.js";
import { canRateReport, hasReportFeedback } from "../utils/reportFeedback.js";

export default function RateServicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reportsApi
      .get(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating from 1 to 5");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(rating));
      if (comment.trim()) fd.append("comment", comment.trim());
      if (photoFile) fd.append("photo", photoFile);
      await feedbackApi.submit(id, fd);
      toast.success("Thank you for rating the service");
      navigate("/", { state: { openReports: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit your review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-black">Loading…</p>;
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

  if (hasReportFeedback(report)) {
    return <Navigate to={`/reports/${id}/review`} replace />;
  }

  if (!canRateReport(report)) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">This report is not ready to be rated yet.</p>
        <Link to="/" className="link-inline mt-4 inline-block">
          Back to My Reports
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <section className="card p-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← Back to My Reports
        </button>
        <h1 className="text-2xl font-bold text-black">Rate Service</h1>
        <p className="mt-2 text-sm text-black/70">
          Share your experience with the cleanup for this report.
        </p>

        <div className="mt-4 rounded-lg border border-theme-border bg-[#fce1ee]/20 p-4">
          <h2 className="font-semibold text-black">{report.title}</h2>
          {report.reportId && (
            <p className="mt-1 font-mono text-xs text-[#6b0f1a]">ID: {report.reportId}</p>
          )}
          <p className="mt-2 text-sm text-black">
            {formatReportCategory(report.category, report.subcategory)}
          </p>
          {report.assignedTeamDisplay && (
            <p className="mt-1 text-sm text-black/70">
              Team: <strong>{report.assignedTeamDisplay}</strong>
            </p>
          )}
          {report.updatedTaskReport?.imageUrl && (
            <img
              src={mediaUrl(report.updatedTaskReport.imageUrl)}
              alt="Cleanup completion"
              className="mt-3 max-h-40 rounded-lg border object-cover"
            />
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <p className="label-text mb-2">Rate the service (1–5)</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <label className="block space-y-1">
            <span className="label-text">Your review (optional)</span>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the cleanup work?"
              className="input-field w-full"
            />
          </label>

          <ReportPhotoPicker photoFile={photoFile} onPhotoChange={setPhotoFile} />

          <button type="submit" disabled={submitting} className="guest-cta-btn px-8 py-3">
            {submitting ? "Submitting…" : "Submit rating"}
          </button>
        </form>
      </section>
    </motion.div>
  );
}
