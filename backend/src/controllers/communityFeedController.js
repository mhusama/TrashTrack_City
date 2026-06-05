import { Report } from "../models/Report.js";
import { FeedbackComment } from "../models/FeedbackComment.js";
import { resolveTeamDisplayName } from "../services/teamRegistryService.js";

function feedbackSubmitted(report) {
  return Boolean(report.feedback?.submittedAt && report.feedback?.rating);
}

function commentPreviewText(comment) {
  if (comment.text?.trim()) return comment.text.trim();
  if (comment.imageUrl) return "Photo";
  if (comment.voiceUrl) return "Voice note";
  return "…";
}

function formatComment(comment, userId) {
  const likes = comment.likes || [];
  return {
    _id: comment._id,
    id: comment._id,
    text: comment.text || "",
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    crewSubRole: comment.crewSubRole || "",
    teamName: comment.teamName || "",
    replyToCommentId: comment.replyToCommentId || null,
    replyToText: comment.replyToText || "",
    replyToSenderName: comment.replyToSenderName || "",
    imageUrl: comment.imageUrl || "",
    voiceUrl: comment.voiceUrl || "",
    createdAt: comment.createdAt,
    likedByMe: userId ? likes.some((id) => id.toString() === userId.toString()) : false,
    likeCount: likes.length,
  };
}

async function formatReviewItem(report, userId) {
  const assignedTeamDisplay = report.assignedTeam
    ? await resolveTeamDisplayName(report.assignedTeam)
    : "";
  const likes = report.feedback?.likes || [];

  return {
    _id: report._id,
    reportId: report.reportId,
    title: report.title,
    description: report.description || "",
    category: report.category,
    status: report.status,
    area: report.area,
    location: report.location,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    resolvedAt: report.resolvedAt,
    underReviewAt: report.underReviewAt,
    assignedTeamDisplay: assignedTeamDisplay || report.assignedTeam || "",
    reviewerName: report.reportedBy?.name || report.reviewerName || "Resident",
    feedback: {
      rating: report.feedback.rating,
      comment: report.feedback.comment || "",
      photoUrl: report.feedback.photoUrl || "",
      submittedAt: report.feedback.submittedAt,
      likedByMe: userId ? likes.some((id) => id.toString() === userId.toString()) : false,
      likeCount: likes.length,
    },
  };
}

export async function listCommunityFeed(req, res) {
  try {
    const reports = await Report.find({
      "feedback.submittedAt": { $exists: true, $ne: null },
      "feedback.rating": { $exists: true, $gte: 1 },
    })
      .populate("reportedBy", "name")
      .sort({ "feedback.submittedAt": -1 })
      .limit(100)
      .lean();

    const reportIds = reports.map((r) => r._id);
    const comments = await FeedbackComment.find({ report: { $in: reportIds } })
      .sort({ createdAt: 1 })
      .lean();

    const commentsByReport = {};
    for (const comment of comments) {
      const key = comment.report.toString();
      if (!commentsByReport[key]) commentsByReport[key] = [];
      commentsByReport[key].push(formatComment(comment, req.user._id));
    }

    const items = await Promise.all(
      reports
        .filter((r) => feedbackSubmitted(r))
        .map(async (r) => {
          const item = await formatReviewItem(r, req.user._id);
          return {
            ...item,
            comments: commentsByReport[r._id.toString()] || [],
          };
        })
    );

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getReviewThread(req, res) {
  try {
    const report = await Report.findById(req.params.reportId).populate("reportedBy", "name");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!feedbackSubmitted(report)) {
      return res.status(404).json({ message: "This report has no public review yet" });
    }

    const comments = await FeedbackComment.find({ report: report._id })
      .sort({ createdAt: 1 })
      .lean();

    const review = await formatReviewItem(report.toObject(), req.user._id);

    res.json({
      review,
      comments: comments.map((c) => formatComment(c, req.user._id)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listFeedComments(req, res) {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!feedbackSubmitted(report)) {
      return res.json({ comments: [] });
    }

    const comments = await FeedbackComment.find({ report: report._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ comments: comments.map((c) => formatComment(c, req.user._id)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addFeedComment(req, res) {
  try {
    const { text, replyToCommentId, replyToReview } = req.body;
    const imageUrl = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : "";
    const voiceUrl = req.files?.voice?.[0] ? `/uploads/${req.files.voice[0].filename}` : "";

    if (!text?.trim() && !imageUrl && !voiceUrl) {
      return res.status(400).json({ message: "Reply text, image, or voice is required" });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!feedbackSubmitted(report)) {
      return res.status(400).json({ message: "This report has no public review yet" });
    }

    let replyToText = "";
    let replyToSenderName = "";
    let resolvedReplyToCommentId = null;
    if (replyToCommentId) {
      const replied = await FeedbackComment.findOne({
        _id: replyToCommentId,
        report: report._id,
      })
        .select("text authorName imageUrl voiceUrl")
        .lean();
      if (!replied) {
        return res.status(404).json({ message: "Reply target not found" });
      }
      resolvedReplyToCommentId = replied._id;
      replyToText = commentPreviewText(replied);
      replyToSenderName = replied.authorName || "";
    } else if (replyToReview === "true" || replyToReview === true) {
      const populated = await Report.findById(report._id).populate("reportedBy", "name").lean();
      replyToText = commentPreviewText({
        text: populated.feedback?.comment,
        imageUrl: populated.feedback?.photoUrl,
      });
      replyToSenderName = populated.reportedBy?.name || "Resident";
    }

    const comment = await FeedbackComment.create({
      report: report._id,
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      crewSubRole: req.user.crewSubRole || "",
      teamName: req.user.teamName || "",
      text: text?.trim() || "",
      replyToCommentId: resolvedReplyToCommentId,
      replyToText,
      replyToSenderName,
      imageUrl,
      voiceUrl,
      likes: [],
    });

    res.status(201).json({ comment: formatComment(comment.toObject(), req.user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function toggleCommentLike(req, res) {
  try {
    const comment = await FeedbackComment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const userId = req.user._id;
    const idx = comment.likes.findIndex((id) => id.equals(userId));
    if (idx >= 0) {
      comment.likes.splice(idx, 1);
    } else {
      comment.likes.push(userId);
    }
    await comment.save();

    res.json({ comment: formatComment(comment.toObject(), userId) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function toggleReviewLike(req, res) {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!feedbackSubmitted(report)) {
      return res.status(400).json({ message: "This report has no public review yet" });
    }

    if (!report.feedback.likes) {
      report.feedback.likes = [];
    }

    const userId = req.user._id;
    const idx = report.feedback.likes.findIndex((id) => id.equals(userId));
    if (idx >= 0) {
      report.feedback.likes.splice(idx, 1);
    } else {
      report.feedback.likes.push(userId);
    }
    await report.save();

    const likes = report.feedback.likes || [];
    res.json({
      likedByMe: likes.some((id) => id.equals(userId)),
      likeCount: likes.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
