import { REPORT_CATEGORY_GROUPS } from "./reportCategories.js";

export const HEATMAP_WASTE_FILTERS = [
  { id: "all", label: "All categories" },
  ...REPORT_CATEGORY_GROUPS.map((group) => ({
    id: group.value,
    label: group.label,
  })),
];

export const HEATMAP_TIME_FILTERS = [
  { id: "today", label: "Today" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "this_month", label: "This Month" },
  { id: "last_3_months", label: "Last 3 Months" },
  { id: "all_time", label: "All Time" },
];

export const HEATMAP_SEVERITY_FILTERS = [
  { id: "all", label: "All severities" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "emergency", label: "Emergency" },
];

export const HEAT_INTENSITY_LEGEND = [
  { color: "#22c55e", label: "Low" },
  { color: "#eab308", label: "Moderate" },
  { color: "#f97316", label: "High" },
  { color: "#ef4444", label: "Critical" },
];
