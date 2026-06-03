import { Notification } from "../models/Notification.js";
import { Report } from "../models/Report.js";
import { getResidentUserModel, getUserModel } from "../models/User.js";
import { sendReportNotification, sendNotificationEmail } from "./mailer.js";

const NEARBY_KM = 2;
const SAME_LOCATION_KM = 0.15;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatReportDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

const STATUS_LABELS = {
  open: "Pending",
  in_progress: "Under Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

export async function notifyStatusChange(report) {
  const ownerId = report.reportedBy?._id || report.reportedBy;
  if (!ownerId) return;

  const label = STATUS_LABELS[report.status] || report.status;
  const message = `Your Issued Report of ${formatReportDate(report.createdAt)} is currently "${label}" by the Municipal Authorities`;

  await Notification.create({
    user: ownerId,
    message,
    type: "status_change",
    report: report._id,
  });
}

export async function notifyReportAssigned(report) {
  const ownerId = report.reportedBy?._id || report.reportedBy;
  if (ownerId) {
    const idLabel = report.reportId ? ` (ID: ${report.reportId})` : "";
    const dateLabel = formatReportDate(report.createdAt);
    await Notification.create({
      user: ownerId,
      message: `Your report "${report.title}"${idLabel} issued ${dateLabel} has been assigned to ${report.assignedTeam} for cleanup.`,
      type: "team_assigned",
      report: report._id,
    });
    // Send email to resident notifying under review
    try {
      const residentEmail = report.reportedBy?.email || (report.reportedBy && report.reportedBy.email) || null;
      if (residentEmail) {
        const subj = `Your report is under review: ${report.title}`;
        const txt = `Your report "${report.title}" has been assigned to ${report.assignedTeam} and is now under review.`;
        sendNotificationEmail({ to: residentEmail, subject: subj, text: txt }).catch(console.error);
      }
    } catch (e) {
      console.error("[notifyReportAssigned] failed to email resident", e?.message || e);
    }
  }
  await notifyCrewTeam(
    report,
    `New task assigned: "${report.title}"${report.reportId ? ` (ID: ${report.reportId})` : ""}.`
  );
}

export async function notifyReportApproved(report) {
  const ownerId = report.reportedBy?._id || report.reportedBy;
  const idLabel = report.reportId ? ` (ID: ${report.reportId})` : "";
  const dateLabel = formatReportDate(report.createdAt);

  if (ownerId) {
    await Notification.create({
      user: ownerId,
      message: `Your report "${report.title}"${idLabel} issued ${dateLabel} has been approved and marked Resolved.`,
      type: "resident_task_completed",
      report: report._id,
    });

    const residentEmail = report.reportedBy?.email;
    console.log("[notifyReportApproved] Sending email to resident:", {
      email: residentEmail,
      title: report.title,
      reportId: report.reportId,
    });

    if (residentEmail) {
      sendNotificationEmail({
        to: residentEmail,
        subject: `Your task is completed: ${report.title}`,
        text: `Good news! Your report "${report.title}" has been reviewed and approved by the admin. The task is now complete.`,
      }).catch((err) => {
        console.error("[notifyReportApproved] Email send error:", err);
      });
    } else {
      console.warn("[notifyReportApproved] No resident email found for report:", report.reportId);
    }
  }

  await notifyCrewTeam(
    report,
    `Report "${report.title}"${idLabel} (issued ${dateLabel}) was approved by the Admin.`,
    {
      subject: `Task approved: ${report.title}`,
      text: `Your team's task "${report.title}" has been approved by the admin. Great work!`,
    }
  );
}

async function notifyCrewTeam(report, message, emailInfo = {}) {
  if (!report.assignedTeam) return;
  const CrewUser = getUserModel("cleaning_crew");
  const crew = await CrewUser.find({ teamName: report.assignedTeam }).select("_id email name").lean();
  if (!crew.length) return;

  await Notification.insertMany(
    crew.map((member) => ({
      user: member._id,
      message,
      type: "crew_update",
      report: report._id,
    }))
  );

  // Send email to each crew member (best-effort)
  await Promise.all(
    crew.map((member) => {
      if (!member.email) return Promise.resolve();
      const subj = emailInfo.subject || `Task update: ${report.title}`;
      const txt =
        emailInfo.text ||
        `Your team has an update for the task "${report.title}". Please check the crew dashboard for details.`;
      return sendNotificationEmail({ to: member.email, subject: subj, text: txt }).catch((err) =>
        console.error("[mailer] Failed to email crew member", member.email, err?.message || err)
      );
    })
  );
}

export async function notifyResidentsAboutNewReport(report) {
  const ownerId = report.reportedBy?._id || report.reportedBy;
  const residents = await getResidentUserModel()
    .find({ role: "resident", _id: { $ne: ownerId } })
    .select("_id");

  const ownerReports = await Report.find({ reportedBy: { $in: residents.map((r) => r._id) } })
    .select("reportedBy location title")
    .lean();

  const reportsByUser = new Map();
  for (const r of ownerReports) {
    const uid = r.reportedBy.toString();
    if (!reportsByUser.has(uid)) reportsByUser.set(uid, []);
    reportsByUser.get(uid).push(r);
  }

  const { lat, lng } = report.location;
  const toCreate = [];

  for (const resident of residents) {
    const uid = resident._id.toString();
    const userReports = reportsByUser.get(uid) || [];

    let sameLocation = false;
    let nearby = false;

    for (const ur of userReports) {
      const dist = haversineKm(lat, lng, ur.location.lat, ur.location.lng);
      if (dist <= SAME_LOCATION_KM) {
        sameLocation = true;
        break;
      }
      if (dist <= NEARBY_KM) nearby = true;
    }

    if (sameLocation) {
      toCreate.push({
        user: resident._id,
        message: `Another resident filed a report near the same trash location as your report "${userReports.find((ur) => haversineKm(lat, lng, ur.location.lat, ur.location.lng) <= SAME_LOCATION_KM)?.title || "existing report"}".`,
        type: "same_location",
        report: report._id,
      });
    } else if (nearby) {
      toCreate.push({
        user: resident._id,
        message: `A new waste report "${report.title}" was filed near your area in Dhaka.`,
        type: "nearby_report",
        report: report._id,
      });
    }
  }

  if (toCreate.length) {
    await Notification.insertMany(toCreate);
  }
}

export async function notifyAdminsAboutReview(report) {
  try {
    const AdminModel = getUserModel("admin");
    const ResidentModel = getResidentUserModel();

    const admins = await AdminModel.find().select("_id email name").lean();
    const legacyAdmins = await ResidentModel.find({ role: "admin" }).select("_id email name").lean();

    const combined = [...(admins || []), ...(legacyAdmins || [])];
    const map = new Map();
    for (const a of combined) {
      const key = (a.email || a._id).toString();
      if (!map.has(key)) map.set(key, a);
    }
    const uniqueAdmins = Array.from(map.values());
    if (!uniqueAdmins.length) return;

    const idLabel = report.reportId ? ` (ID: ${report.reportId})` : "";
    const dateLabel = formatReportDate(report.createdAt);
    const message = `Report "${report.title}"${idLabel} issued ${dateLabel} has been submitted for approval and is under review.`;

    await Notification.insertMany(
      uniqueAdmins.map((a) => ({
        user: a._id,
        message,
        type: "admin_review_needed",
        report: report._id,
      }))
    );

    await Promise.all(
      uniqueAdmins.map((a) =>
        sendNotificationEmail({
          to: a.email,
          subject: `Task under review: ${report.title}`,
          text: `The report "${report.title}" has been completed by the assigned team and is now waiting for admin approval.`,
        }).catch((err) =>
          console.error("[mailer] Failed to email admin", a.email, err?.message || err)
        )
      )
    );
  } catch (err) {
    console.error("[notifyAdminsAboutReview] error:", err?.message || err);
  }
}

export async function notifyAdminsAboutNewReport(report) {
  try {
    const AdminModel = getUserModel("admin");
    const ResidentModel = getResidentUserModel();

    const admins = await AdminModel.find().select("_id email name").lean();
    const legacyAdmins = await ResidentModel.find({ role: "admin" }).select("_id email name").lean();

    const combined = [...(admins || []), ...(legacyAdmins || [])];
    const map = new Map();
    for (const a of combined) {
      const key = (a.email || a._id).toString();
      if (!map.has(key)) map.set(key, a);
    }
    const uniqueAdmins = Array.from(map.values());
    if (!uniqueAdmins.length) return;

    const idLabel = report.reportId ? ` (ID: ${report.reportId})` : "";
    const dateLabel = formatReportDate(report.createdAt);
    const message = `New report "${report.title}"${idLabel} issued ${dateLabel} requires your attention.`;

    // Create notifications for each admin
    await Notification.insertMany(
      uniqueAdmins.map((a) => ({
        user: a._id,
        message,
        type: "admin_new_report",
        report: report._id,
      }))
    );

    // Send emails to admins (best-effort)
    await Promise.all(
      uniqueAdmins.map((a) =>
        sendReportNotification({ to: a.email, report }).catch((err) =>
          console.error("[mailer] Failed to email admin", a.email, err?.message || err)
        )
      )
    );
  } catch (err) {
    console.error("[notifyAdmins] error:", err?.message || err);
  }
}
