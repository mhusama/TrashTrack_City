/** Report category keys — must match frontend REPORT_CATEGORY_GROUPS / Report.category */
export const HEATMAP_WASTE_TYPES = [
  { id: "household_waste", label: "Household Waste" },
  { id: "recyclable_waste", label: "Recyclable Waste" },
  { id: "electronic_waste", label: "Electronic Waste (E-Waste)" },
  { id: "hazardous_waste", label: "Hazardous Waste" },
  { id: "construction_demolition_waste", label: "Construction & Demolition Waste" },
  { id: "organic_biodegradable_waste", label: "Organic/Biodegradable Waste" },
  { id: "industrial_waste", label: "Industrial Waste" },
  { id: "drainage_waterlogging_waste", label: "Drainage & Waterlogging Waste" },
  { id: "street_public_litter", label: "Street & Public Area Litter" },
  { id: "dead_animal_bio_waste", label: "Dead Animal / Bio Waste" },
  { id: "missed_pickup", label: "Missed Pickup" },
  { id: "other", label: "Other" },
];

/** Legacy heatmap filter ids from before category alignment */
const LEGACY_WASTE_TYPE_MAP = {
  household: "household_waste",
  plastic: "recyclable_waste",
  organic: "organic_biodegradable_waste",
  e_waste: "electronic_waste",
  hazardous: "hazardous_waste",
  medical: "hazardous_waste",
  construction: "construction_demolition_waste",
  drainage: "drainage_waterlogging_waste",
  street_litter: "street_public_litter",
};

export function normalizeWasteTypeId(wasteTypeId) {
  if (!wasteTypeId || wasteTypeId === "all") return "all";
  return LEGACY_WASTE_TYPE_MAP[wasteTypeId] || wasteTypeId;
}

export function getWasteTypeMeta(id) {
  const normalized = normalizeWasteTypeId(id);
  return HEATMAP_WASTE_TYPES.find((w) => w.id === normalized);
}

export function reportMatchesWasteType(report, wasteTypeId) {
  const normalized = normalizeWasteTypeId(wasteTypeId);
  if (normalized === "all") return true;

  const meta = getWasteTypeMeta(normalized);
  if (!meta) return report.category === normalized;

  return report.category === meta.id;
}

export function dominantWasteLabel(category) {
  const meta = HEATMAP_WASTE_TYPES.find((w) => w.id === category);
  return meta?.label || category?.replace(/_/g, " ") || "Other";
}
