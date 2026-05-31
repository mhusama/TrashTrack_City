/** UI waste-type keys → MongoDB report filters. */
export const HEATMAP_WASTE_TYPES = [
  { id: "household", label: "Household Waste", categories: ["household_waste"] },
  {
    id: "plastic",
    label: "Plastic Waste",
    categories: ["recyclable_waste"],
    subcategoryMatch: /plastic/i,
  },
  {
    id: "organic",
    label: "Organic Waste",
    categories: ["organic_biodegradable_waste"],
  },
  { id: "e_waste", label: "E-Waste", categories: ["electronic_waste"] },
  {
    id: "hazardous",
    label: "Hazardous Waste",
    categories: ["hazardous_waste"],
    excludeSubcategories: ["medical_waste"],
  },
  {
    id: "medical",
    label: "Medical Waste",
    categories: ["hazardous_waste", "dead_animal_bio_waste"],
    subcategories: ["medical_waste"],
    includeDeadAnimal: true,
  },
  {
    id: "construction",
    label: "Construction Waste",
    categories: ["construction_demolition_waste"],
  },
  {
    id: "drainage",
    label: "Drainage Waste",
    categories: ["drainage_waterlogging_waste"],
  },
  {
    id: "street_litter",
    label: "Street Litter",
    categories: ["street_public_litter"],
  },
];

export function getWasteTypeMeta(id) {
  return HEATMAP_WASTE_TYPES.find((w) => w.id === id);
}

export function reportMatchesWasteType(report, wasteTypeId) {
  if (!wasteTypeId || wasteTypeId === "all") return true;
  const meta = getWasteTypeMeta(wasteTypeId);
  if (!meta) return true;

  const cat = report.category || "";
  const sub = report.subcategory || "";

  if (meta.includeDeadAnimal && cat === "dead_animal_bio_waste") return true;

  if (!meta.categories.includes(cat)) return false;

  if (meta.subcategories?.length) {
    return meta.subcategories.includes(sub);
  }

  if (meta.excludeSubcategories?.length && meta.excludeSubcategories.includes(sub)) {
    return false;
  }

  if (meta.subcategoryMatch) {
    return meta.subcategoryMatch.test(sub);
  }

  return true;
}

export function dominantWasteLabel(category) {
  const meta = HEATMAP_WASTE_TYPES.find((w) => w.categories.includes(category));
  return meta?.label || category?.replace(/_/g, " ") || "Other";
}
