import { inferReportArea } from "../config/dhakaAreas.js";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export function getResolvedTimestamp(report) {
  if (report.resolvedAt) {
    return new Date(report.resolvedAt).getTime();
  }
  if (report.status === "resolved") {
    return new Date(report.updatedAt).getTime();
  }
  return 0;
}

export function getUnderReviewStart(report) {
  if (report.underReviewAt) {
    return new Date(report.underReviewAt);
  }
  if (report.status === "in_progress") {
    return new Date(report.updatedAt);
  }
  return null;
}

export function getDaysUnderReview(report, now = new Date()) {
  const start = getUnderReviewStart(report);
  if (!start || report.status !== "in_progress") {
    return 0;
  }
  const diffMs = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function filterReports(reports, sortMode, now = new Date()) {
  const nowMs = now.getTime();

  switch (sortMode.type) {
    case "area":
      return reports.filter((report) => inferReportArea(report) === sortMode.area);

    case "recent":
      return reports.filter((report) => nowMs - new Date(report.createdAt).getTime() <= TEN_DAYS_MS);

    case "resolved":
      return reports
        .filter((report) => report.status === "resolved")
        .sort((a, b) => getResolvedTimestamp(b) - getResolvedTimestamp(a));

    case "under_review":
      return reports
        .filter((report) => report.status === "in_progress")
        .sort((a, b) => {
          const dayDiff = getDaysUnderReview(b, now) - getDaysUnderReview(a, now);
          if (dayDiff !== 0) {
            return dayDiff;
          }
          const aStart = getUnderReviewStart(a)?.getTime() || 0;
          const bStart = getUnderReviewStart(b)?.getTime() || 0;
          return bStart - aStart;
        });

    default:
      return reports;
  }
}

export function getFilterLabel(sortMode) {
  switch (sortMode.type) {
    case "area":
      return `Reports in ${sortMode.area}`;
    case "recent":
      return "Recent reports (last 10 days)";
    case "resolved":
      return "Resolved reports";
    case "under_review":
      return "Under review reports";
    default:
      return "My Reports";
  }
}
