export const SMELL_RISK_OPTIONS = [
  { value: "no_smell", label: "No smell" },
  { value: "mild_odor", label: "Mild odor" },
  { value: "strong_odor", label: "Strong odor" },
  { value: "dangerous", label: "Dangerous" },
];

export const WASTE_SPREAD_OPTIONS = [
  { value: "less_than_1sqm", label: "Less than 1m²" },
  { value: "1_to_5sqm", label: "1–5m²" },
  { value: "large_area", label: "Large area" },
];

export const SENSITIVE_LOCATION_OPTIONS = [
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "residential_area", label: "Residential area" },
  { value: "water_body", label: "Water body" },
  { value: "market", label: "Market" },
];

export function smellRiskLabel(value) {
  return SMELL_RISK_OPTIONS.find((option) => option.value === value)?.label || value || "—";
}

export function wasteSpreadLabel(value) {
  return WASTE_SPREAD_OPTIONS.find((option) => option.value === value)?.label || value || "—";
}

export function sensitiveLocationLabel(value) {
  return SENSITIVE_LOCATION_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function formatSensitiveLocations(values = []) {
  if (!values?.length) return "None selected";
  return values.map(sensitiveLocationLabel).join(", ");
}
