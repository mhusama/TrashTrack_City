import { hasPendingAdminApproval, MAP_MARKER_COLORS } from "./reportStatus.js";

export const CREW_STATUS_LABELS = {
  assigned: "Assigned",
  disposal_in_progress: "Disposal in Progress",
  awaiting_approval: "Pending Approval",
  approved: "Approved",
};

export const CREW_MAP_MARKER_COLORS = {
  assigned: "#dc2626",
  disposal_in_progress: "#ca8a04",
  awaiting_approval: "#ea580c",
  approved: "#16a34a",
};

export function crewStatusLabel(crewStatus) {
  return CREW_STATUS_LABELS[crewStatus] || crewStatus || "Assigned";
}

/** Same state as admin PENDING APPROVAL (updated task report submitted, awaits sign-off). */
export function crewStatusLabelForReport(report) {
  if (report?.status === "resolved") {
    return CREW_STATUS_LABELS.approved;
  }
  if (hasPendingAdminApproval(report)) {
    return CREW_STATUS_LABELS.awaiting_approval;
  }
  return crewStatusLabel(report?.crewStatus);
}

export function crewMapMarkerColor(crewStatus) {
  return CREW_MAP_MARKER_COLORS[crewStatus] || CREW_MAP_MARKER_COLORS.assigned;
}

export function crewMapMarkerColorForReport(report) {
  if (report?.status === "resolved") {
    return CREW_MAP_MARKER_COLORS.approved;
  }
  if (hasPendingAdminApproval(report)) {
    return MAP_MARKER_COLORS.awaiting_approval;
  }
  return crewMapMarkerColor(report?.crewStatus);
}
