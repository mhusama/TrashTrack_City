export const CREW_STATUS_LABELS = {
  assigned: "Assigned",
  disposal_in_progress: "Disposal in Progress",
  awaiting_approval: "Awaiting Approval",
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

export function crewMapMarkerColor(crewStatus) {
  return CREW_MAP_MARKER_COLORS[crewStatus] || CREW_MAP_MARKER_COLORS.assigned;
}
