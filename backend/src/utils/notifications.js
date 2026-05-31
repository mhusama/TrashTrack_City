import { Notification } from "../models/Notification.js";
import { Report } from "../models/Report.js";
import { getResidentUserModel, getUserModel } from "../models/User.js";

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
      type: "report_approved",
      report: report._id,
    });
  }

  await notifyCrewTeam(
    report,
    `Report "${report.title}"${idLabel} (issued ${dateLabel}) was approved by the Admin.`
  );
}

async function notifyCrewTeam(report, message) {
  if (!report.assignedTeam) return;
  const CrewUser = getUserModel("cleaning_crew");
  const crew = await CrewUser.find({ teamName: report.assignedTeam }).select("_id");
  if (!crew.length) return;

  await Notification.insertMany(
    crew.map((member) => ({
      user: member._id,
      message,
      type: "crew_update",
      report: report._id,
    }))
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
