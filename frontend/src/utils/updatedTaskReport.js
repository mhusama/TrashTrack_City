export function hasUpdatedTaskReport(report) {
  const updated = report?.updatedTaskReport;
  if (!updated) return false;
  return Boolean(
    updated.submittedAt ||
      String(updated.description || "").trim() ||
      String(updated.imageUrl || "").trim()
  );
}

export function shouldShowUpdatedTaskReportSection(report) {
  if (!report) return false;
  if (hasUpdatedTaskReport(report)) return true;
  return report.status === "resolved" && report.approvalRemark === "approved";
}
