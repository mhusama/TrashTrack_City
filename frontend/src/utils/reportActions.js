const EDITABLE_STATUSES = new Set(["open", "in_progress"]);

export function canResidentModifyReport(report) {
  return EDITABLE_STATUSES.has(report?.status);
}
