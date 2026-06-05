export function hasReportFeedback(report) {
  return Boolean(report?.feedback?.submittedAt && report?.feedback?.rating);
}

export function canRateReport(report) {
  return report?.status === "resolved" && !hasReportFeedback(report);
}
