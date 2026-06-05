/** Derive complaint severity for heatmap filters and hotspot tooltips. */
export function computeReportSeverity(report) {
  const smell = report.smellRisk || "";
  const spread = report.wasteSpreadArea || "";
  const sensitive = report.sensitiveLocations || [];
  const category = report.category || "";

  if (smell === "dangerous") return "emergency";
  if (category === "dead_animal_bio_waste") return "emergency";
  if (category === "hazardous_waste" && report.subcategory === "medical_waste") {
    return "emergency";
  }
  if (
    sensitive.includes("hospital") &&
    (smell === "strong_odor" || smell === "dangerous")
  ) {
    return "emergency";
  }

  if (smell === "strong_odor" || spread === "large_area") return "high";
  if (category === "hazardous_waste" || category === "industrial_waste") return "high";

  if (smell === "mild_odor" || spread === "1_to_5sqm") return "medium";

  return "low";
}

export const SEVERITY_WEIGHT = {
  low: 0.35,
  medium: 0.55,
  high: 0.8,
  emergency: 1,
};

export function severityLabel(severity) {
  const labels = {
    low: "Low",
    medium: "Medium",
    high: "High",
    emergency: "Emergency",
  };
  return labels[severity] || severity;
}

/**
 * Heatmap color intensity: blends average severity with relative complaint density.
 * Steeper density curve keeps quiet zones green while the busiest zone still reads orange.
 */
export function computeHeatIntensity({ count, weightSum }, maxCellCount) {
  const safeCount = Math.max(1, count);
  const maxCount = Math.max(1, maxCellCount);
  const avgSeverity = weightSum / safeCount;

  const densityRatio = safeCount / maxCount;
  const densityScore = Math.pow(densityRatio, 0.65);

  const blended = 0.35 * avgSeverity + 0.65 * densityScore;
  return Math.max(0.2, Math.min(1, blended));
}
