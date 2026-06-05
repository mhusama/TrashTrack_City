import { Report } from "../models/Report.js";
import { resolveTeamDisplayName } from "../services/teamRegistryService.js";
import { applyTeamLeaderRating, removeTeamLeaderRating, updateTeamLeaderRating } from "../services/teamLeaderRatingService.js";
import {
  assertResidentNotBlocked,
  logResidentActivity,
  syncResidentReviewStats,
} from "../services/residentActivityService.js";

function feedbackSubmitted(report) {
  return Boolean(report.feedback?.submittedAt && report.feedback?.rating);
}

async function loadOwnedResolvedReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return null;
  }
  if (report.reportedBy.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: "Access denied" });
    return null;
  }
  if (report.status !== "resolved") {
    res.status(400).json({ message: "Only resolved reports can be reviewed" });
    return null;
  }
  return report;
}

export async function listFeedbackReports(req, res) {
  try {
    if (req.user.role !== "resident") {
      return res.status(403).json({ message: "Residents only" });
    }

    const reports = await Report.find({
      reportedBy: req.user._id,
      status: "resolved",
    })
      .sort({ resolvedAt: -1, createdAt: -1 })
      .lean();

    const assignedKeys = [
      ...new Set(reports.map((r) => r.assignedTeam).filter((t) => t && String(t).trim())),
    ];
    const labelMap = {};
    await Promise.all(
      assignedKeys.map(async (k) => {
        labelMap[k] = await resolveTeamDisplayName(k);
      })
    );

    res.json({
      reports: reports.map((r) => ({
        _id: r._id,
        reportId: r.reportId,
        title: r.title,
        category: r.category,
        resolvedAt: r.resolvedAt,
        createdAt: r.createdAt,
        assignedTeam: r.assignedTeam,
        assignedTeamDisplay: r.assignedTeam ? labelMap[r.assignedTeam] || r.assignedTeam : "",
        photoUrl: r.photoUrl,
        updatedTaskReport: r.updatedTaskReport,
        feedback: r.feedback?.submittedAt
          ? {
              rating: r.feedback.rating,
              comment: r.feedback.comment || "",
              photoUrl: r.feedback.photoUrl || "",
              submittedAt: r.feedback.submittedAt,
            }
          : null,
        hasFeedback: feedbackSubmitted(r),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function submitFeedback(req, res) {
  try {
    if (req.user.role !== "resident") {
      return res.status(403).json({ message: "Residents only" });
    }
    await assertResidentNotBlocked(req.user._id);

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (report.status !== "resolved") {
      return res.status(400).json({ message: "Only resolved reports can be reviewed" });
    }

    if (feedbackSubmitted(report)) {
      return res.status(409).json({ message: "Feedback already submitted for this report" });
    }

    const comment = String(req.body.comment || "").trim();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const feedback = {
      rating,
      comment,
      photoUrl,
      submittedAt: new Date(),
    };

    const updated = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        reportedBy: req.user._id,
        status: "resolved",
        $or: [
          { "feedback.submittedAt": { $exists: false } },
          { "feedback.submittedAt": null },
          { "feedback.rating": { $exists: false } },
          { "feedback.rating": null },
        ],
      },
      { $set: { feedback } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "Feedback already submitted for this report" });
    }

    if (updated.assignedTeam) {
      await applyTeamLeaderRating(updated.assignedTeam, rating);
    }

    await syncResidentReviewStats(req.user._id);
    await logResidentActivity({
      residentId: req.user._id,
      residentPublicId: req.user.residentId || "",
      activityType: "review_posted",
      activityLabel: "Posted a review",
      reportId: updated._id,
    });

    res.status(201).json({
      feedback: updated.feedback,
      reportId: updated._id,
      message: "Thank you for your feedback",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateFeedback(req, res) {
  try {
    if (req.user.role !== "resident") {
      return res.status(403).json({ message: "Residents only" });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }

    const report = await loadOwnedResolvedReport(req, res);
    if (!report) return;

    if (!feedbackSubmitted(report)) {
      return res.status(404).json({ message: "No review found for this report" });
    }

    const oldRating = report.feedback.rating;
    const comment = String(req.body.comment || "").trim();
    const photoUrl = req.file
      ? `/uploads/${req.file.filename}`
      : report.feedback.photoUrl || "";

    report.feedback = {
      rating,
      comment,
      photoUrl,
      submittedAt: report.feedback.submittedAt,
    };
    report.markModified("feedback");
    await report.save();

    if (report.assignedTeam && oldRating !== rating) {
      await updateTeamLeaderRating(report.assignedTeam, oldRating, rating);
    }

    await syncResidentReviewStats(req.user._id);

    res.json({
      feedback: report.feedback,
      message: "Review updated",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteFeedback(req, res) {
  try {
    if (req.user.role !== "resident") {
      return res.status(403).json({ message: "Residents only" });
    }

    const report = await loadOwnedResolvedReport(req, res);
    if (!report) return;

    if (!feedbackSubmitted(report)) {
      return res.status(404).json({ message: "No review found for this report" });
    }

    const oldRating = report.feedback.rating;
    const teamName = report.assignedTeam;

    await Report.updateOne({ _id: report._id }, { $unset: { feedback: "" } });
    await FeedbackComment.deleteMany({ report: report._id });

    if (teamName) {
      await removeTeamLeaderRating(teamName, oldRating);
    }

    await syncResidentReviewStats(req.user._id);

    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
