import { ResidentActivity } from "../models/ResidentActivity.js";
import { getResidentUserModel } from "../models/User.js";
import { getResidentStatsMap } from "../services/residentActivityService.js";

export async function listResidentActivities(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const activities = await ResidentActivity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const statsMap = await getResidentStatsMap(activities.map((activity) => activity.resident));

    res.json({
      activities: activities.map((activity) => {
        const stats = statsMap[activity.resident.toString()] || {
          residentId: activity.residentId || "—",
          reportsAccepted: 0,
          reportsRejected: 0,
          reviewsGivenCount: 0,
          averageReviewRatingGiven: 0,
          blocked: false,
        };

        return {
          _id: activity._id,
          residentUserId: activity.resident,
          residentId: stats.residentId !== "—" ? stats.residentId : activity.residentId || "—",
          activity: activity.activityLabel,
          date: activity.createdAt,
          reportsAccepted: stats.reportsAccepted,
          reportsRejected: stats.reportsRejected,
          reviewsGivenCount: stats.reviewsGivenCount,
          averageReviewRatingGiven: stats.averageReviewRatingGiven,
          blocked: stats.blocked,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function setResidentBlocked(req, res) {
  try {
    const { blocked } = req.body;
    if (typeof blocked !== "boolean") {
      return res.status(400).json({ message: "blocked must be true or false" });
    }

    const user = await getResidentUserModel().findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Resident not found" });
    }
    if (user.role && user.role !== "resident") {
      return res.status(400).json({ message: "Only residents can be blocked from this panel" });
    }

    user.blocked = blocked;
    await user.save();

    res.json({
      user: {
        _id: user._id,
        residentId: user.residentId || "",
        blocked: user.blocked,
      },
      message: blocked ? "Resident blocked" : "Resident unblocked",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
