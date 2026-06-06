export const REPORT_STATUS_OPTIONS = [
  { value: "open", label: "Pending" },
  { value: "in_progress", label: "Under Review" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export const STATUS_TABLE_STYLES = {
  open: {
    label: "PENDING",
    rowBg: "#ffc2ce",
    textClass: "font-bold text-red-600",
  },
  in_progress: {
    label: "Under Review",
    rowBg: "#fff2c2",
    textClass: "font-bold text-yellow-600",
  },
  resolved: {
    label: "RESOLVED",
    rowBg: "#d9ffc2",
    textClass: "font-bold text-green-600",
  },
  rejected: {
    label: "REJECTED",
    rowBg: "#c2f2ff",
    textClass: "font-bold text-blue-600",
  },
  awaiting_approval: {
    label: "PENDING APPROVAL",
    rowBg: "#fed7aa",
    textClass: "font-bold text-orange-700",
  },
};

/** Team leader submitted an updated task report and it awaits admin sign-off. */
export function hasPendingAdminApproval(report) {
  return (
    report.crewStatus === "awaiting_approval" &&
    Boolean(report.updatedTaskReport?.submittedAt)
  );
}

/** Admin table: pending approval only after updated task report submission. */
export function adminTableStatusKey(report) {
  if (hasPendingAdminApproval(report)) return "awaiting_approval";
  return report.status;
}

export const STATUS_SORT_ORDER = {
  open: 0,
  in_progress: 1,
  rejected: 2,
  resolved: 3,
};

export const MAP_MARKER_COLORS = {
  open: "#dc2626",
  in_progress: "#ca8a04",
  resolved: "#16a34a",
  rejected: "#2563eb",
  awaiting_approval: "#f97316",
};

/** Admin map triangle colour — orange when updated task report awaits approval. */
export function getAdminMapMarkerColor(report) {
  if (report.status === "resolved") {
    return MAP_MARKER_COLORS.resolved;
  }
  if (hasPendingAdminApproval(report)) {
    return MAP_MARKER_COLORS.awaiting_approval;
  }
  return MAP_MARKER_COLORS[report.status] || MAP_MARKER_COLORS.open;
}

export function sortReportsByResidentThenDate(reports) {
  return [...reports].sort((a, b) => {
    const ra =
      (a.reportedBy?.residentId && String(a.reportedBy.residentId)) ||
      (a.reportedBy?._id && String(a.reportedBy._id)) ||
      "";
    const rb =
      (b.reportedBy?.residentId && String(b.reportedBy.residentId)) ||
      (b.reportedBy?._id && String(b.reportedBy._id)) ||
      "";
    if (ra !== rb) return ra.localeCompare(rb);
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

export function sortReportsForAdminTable(reports) {
  return [...reports].sort((a, b) => {
    const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export function statusLabel(status) {
  return STATUS_TABLE_STYLES[status]?.label ?? status;
}
