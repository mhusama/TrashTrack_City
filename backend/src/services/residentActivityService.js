import { Report } from "../models/Report.js";
import { ResidentActivity } from "../models/ResidentActivity.js";
import { getResidentUserModel } from "../models/User.js";

export async function isResidentBlocked(userId) {
  const user = await getResidentUserModel().findById(userId).select("blocked role").lean();
  if (!user) return false;
  if (user.role && user.role !== "resident") return false;
  return Boolean(user.blocked);
}

export async function assertResidentNotBlocked(userId) {
  if (await isResidentBlocked(userId)) {
    const err = new Error("Your account has been blocked. Contact support for help.");
    err.status = 403;
    throw err;
  }
}

export async function logResidentActivity({
  residentId,
  residentPublicId = "",
  activityType,
  activityLabel,
  reportId = null,
}) {
  await ResidentActivity.create({
    resident: residentId,
    residentId: residentPublicId || "",
    activityType,
    activityLabel,
    report: reportId,
  });
}

export async function updateReportOutcomeCounts(reportedBy, previousStatus, newStatus) {
  if (!reportedBy || previousStatus === newStatus) return;

  const inc = {};
  if (newStatus === "resolved" && previousStatus !== "resolved") {
    inc.reportsAccepted = 1;
  } else if (previousStatus === "resolved" && newStatus !== "resolved") {
    inc.reportsAccepted = -1;
  }

  if (newStatus === "rejected" && previousStatus !== "rejected") {
    inc.reportsRejected = 1;
  } else if (previousStatus === "rejected" && newStatus !== "rejected") {
    inc.reportsRejected = -1;
  }

  if (!Object.keys(inc).length) return;

  await getResidentUserModel().findByIdAndUpdate(reportedBy, { $inc: inc });
}

export async function syncResidentReviewStats(residentId) {
  const reports = await Report.find({
    reportedBy: residentId,
    "feedback.rating": { $gte: 1, $lte: 5 },
    "feedback.submittedAt": { $exists: true, $ne: null },
  })
    .select("feedback.rating")
    .lean();

  const reviewsGivenCount = reports.length;
  const averageReviewRatingGiven = reviewsGivenCount
    ? Math.round(
        (reports.reduce((sum, report) => sum + report.feedback.rating, 0) / reviewsGivenCount) *
          100
      ) / 100
    : 0;

  await getResidentUserModel().findByIdAndUpdate(residentId, {
    reviewsGivenCount,
    averageReviewRatingGiven,
  });
}

export async function getResidentStatsMap(residentIds) {
  const uniqueIds = [...new Set(residentIds.map((id) => id?.toString()).filter(Boolean))];
  if (!uniqueIds.length) return {};

  const users = await getResidentUserModel()
    .find({ _id: { $in: uniqueIds } })
    .select(
      "residentId reportsAccepted reportsRejected reviewsGivenCount averageReviewRatingGiven blocked"
    )
    .lean();

  const map = {};
  for (const user of users) {
    map[user._id.toString()] = {
      residentId: user.residentId || "—",
      reportsAccepted: user.reportsAccepted || 0,
      reportsRejected: user.reportsRejected || 0,
      reviewsGivenCount: user.reviewsGivenCount || 0,
      averageReviewRatingGiven: user.averageReviewRatingGiven || 0,
      blocked: Boolean(user.blocked),
    };
  }
  return map;
}
