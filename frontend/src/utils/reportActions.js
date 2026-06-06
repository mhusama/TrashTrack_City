const EDITABLE_STATUSES = new Set(["open"]);

export function canResidentModifyReport(report) {
  return EDITABLE_STATUSES.has(report?.status);
}
