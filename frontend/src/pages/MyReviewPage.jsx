import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { feedbackApi, communityFeedApi, reportsApi } from "../api/client.js";
import ReportPhotoPicker from "../components/ReportPhotoPicker.jsx";
import ReviewCommentsSection from "../components/ReviewCommentsSection.jsx";
import StarRating from "../components/StarRating.jsx";
import { formatReportCategory } from "../config/reportCategories.js";
import { mediaUrl } from "../utils/mediaUrl.js";
import { hasReportFeedback } from "../utils/reportFeedback.js";

function ReportSummary({ report }) {
  return (
    <div className="rounded-lg border border-theme-border bg-[#fce1ee]/20 p-4">
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
    </div>
  );
}

export default function MyReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState([]);

  const loadComments = () =>
    communityFeedApi
      .getComments(id)
      .then((res) => setComments(res.data.comments))
      .catch(() => setComments([]));

  const loadReport = () =>
    reportsApi
      .get(id)
      .then((res) => {
        setReport(res.data.report);
        return res.data.report;
      })
      .catch(() => {
        toast.error("Report not found");
        return null;
      });

  useEffect(() => {
    Promise.all([loadReport(), loadComments()]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!report?.feedback) return;
    setRating(report.feedback.rating || 0);
    setComment(report.feedback.comment || "");
    setPhotoFile(null);
  }, [report]);

  const handleEdit = () => {
    setEditing(true);
    setPhotoFile(null);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setRating(report.feedback.rating || 0);
    setComment(report.feedback.comment || "");
    setPhotoFile(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating from 1 to 5");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(rating));
      fd.append("comment", comment.trim());
      if (photoFile) fd.append("photo", photoFile);
      const res = await feedbackApi.update(id, fd);
      toast.success("Review updated");
      setReport((prev) => ({ ...prev, feedback: res.data.feedback }));
      setEditing(false);
      setPhotoFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your review? You can submit a new one later.")) {
      return;
    }

    setDeleting(true);
    try {
      await feedbackApi.remove(id);
      toast.success("Review deleted");
      navigate("/", { state: { openReports: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete review");
    } finally {
      setDeleting(false);
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

  if (!hasReportFeedback(report)) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">No review found for this report.</p>
        <Link to={`/reports/${id}/rate`} className="guest-cta-btn mt-4 inline-block px-6 py-2">
          Rate Service
        </Link>
      </div>
    );
  }

  const feedback = report.feedback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <section className="card p-6">
        <button
          type="button"
          onClick={() => navigate("/", { state: { openReports: true } })}
          className="mb-4 text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← Back to My Reports
        </button>

        <h1 className="text-2xl font-bold text-black">
          {editing ? "Edit Review" : "My Review"}
        </h1>

        <div className="mt-4">
          <ReportSummary report={report} />
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="mt-6 space-y-6">
            <div>
              <p className="label-text mb-2">Rating (1–5)</p>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <label className="block space-y-1">
              <span className="label-text">Your review</span>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the cleanup work?"
                className="input-field w-full"
              />
            </label>
            {feedback.photoUrl && !photoFile && (
              <div className="space-y-2">
                <p className="label-text">Current photo</p>
                <img
                  src={mediaUrl(feedback.photoUrl)}
                  alt="Current review photo"
                  className="max-h-40 rounded-lg border object-cover"
                />
              </div>
            )}
            <ReportPhotoPicker
              photoFile={photoFile}
              onPhotoChange={setPhotoFile}
              label="Replace photo (optional)"
              emptyLabel="Upload & crop new photo"
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={submitting} className="guest-cta-btn px-8 py-3">
                {submitting ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-theme-border px-6 py-3 text-sm text-black hover:bg-[#fce1ee]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <p className="label-text mb-2">Your rating</p>
              <StarRating value={feedback.rating} readOnly size="lg" />
            </div>
            {feedback.comment ? (
              <div>
                <p className="label-text mb-1">Your review</p>
                <p className="text-black">{feedback.comment}</p>
              </div>
            ) : (
              <p className="text-sm text-black/60">No written review.</p>
            )}
            {feedback.photoUrl && (
              <div>
                <p className="label-text mb-2">Photo</p>
                <img
                  src={mediaUrl(feedback.photoUrl)}
                  alt="Review photo"
                  className="max-h-48 rounded-lg border object-cover"
                />
              </div>
            )}
            <p className="text-xs text-black/60">
              Submitted {new Date(feedback.submittedAt).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-3 border-t border-theme-border pt-4">
              <button type="button" onClick={handleEdit} className="guest-cta-btn px-6 py-2">
                Edit review
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete review"}
              </button>
            </div>
          </div>
        )}

        <ReviewCommentsSection
          reportId={id}
          comments={comments}
          backPath={`/reports/${id}/review`}
          backLabel="Back to My Review"
          className="mt-6"
        />
      </section>
    </motion.div>
  );
}
