export const REPORT_CATEGORY_GROUPS = [
  {
    value: "household_waste",
    label: "Household Waste",
    subcategories: [
      { value: "mixed_garbage", label: "Mixed garbage" },
      { value: "kitchen_waste", label: "Kitchen waste" },
      { value: "food_leftovers", label: "Food leftovers" },
      { value: "daily_household_trash", label: "Daily household trash" },
    ],
  },
  {
    value: "recyclable_waste",
    label: "Recyclable Waste",
    subcategories: [
      { value: "plastic_bottles", label: "Plastic bottles" },
      { value: "paper_cartons", label: "Paper/cartons" },
      { value: "glass", label: "Glass" },
      { value: "aluminum_cans", label: "Aluminum cans" },
      { value: "packaging_materials", label: "Packaging materials" },
    ],
  },
  {
    value: "electronic_waste",
    label: "Electronic Waste (E-Waste)",
    subcategories: [
      { value: "packaging_materials", label: "Packaging materials" },
      { value: "broken_phones", label: "Broken phones" },
      { value: "batteries", label: "Batteries" },
      { value: "chargers", label: "Chargers" },
      { value: "computers", label: "Computers" },
      { value: "tv_appliances", label: "TV/appliances" },
    ],
  },
  {
    value: "hazardous_waste",
    label: "Hazardous Waste",
    subcategories: [
      { value: "chemicals", label: "Chemicals" },
      { value: "medical_waste", label: "Medical waste" },
      { value: "sharp_objects", label: "Sharp objects" },
      { value: "toxic_materials", label: "Toxic materials" },
      { value: "paint_oil_containers", label: "Paint/oil containers" },
    ],
  },
  {
    value: "construction_demolition_waste",
    label: "Construction & Demolition Waste",
    subcategories: [
      { value: "bricks", label: "Bricks" },
      { value: "cement", label: "Cement" },
      { value: "sand", label: "Sand" },
      { value: "broken_tiles", label: "Broken tiles" },
      { value: "wood_pieces", label: "Wood pieces" },
    ],
  },
  {
    value: "organic_biodegradable_waste",
    label: "Organic/Biodegradable Waste",
    subcategories: [
      { value: "leaves", label: "Leaves" },
      { value: "tree_branches", label: "Tree branches" },
      { value: "garden_waste", label: "Garden waste" },
      { value: "rotten_fruits_vegetables", label: "Rotten fruits/vegetables" },
    ],
  },
  {
    value: "industrial_waste",
    label: "Industrial Waste",
    subcategories: [
      { value: "factory_waste", label: "Factory waste" },
      { value: "heavy_materials", label: "Heavy materials" },
      { value: "chemical_containers", label: "Chemical containers" },
    ],
  },
  {
    value: "drainage_waterlogging_waste",
    label: "Drainage & Waterlogging Waste",
    subcategories: [
      { value: "blocked_drain", label: "Blocked drain" },
      { value: "plastic_clogged_drainage", label: "Plastic-clogged drainage" },
      { value: "sewage_overflow", label: "Sewage overflow" },
    ],
  },
  {
    value: "street_public_litter",
    label: "Street & Public Area Litter",
    subcategories: [
      { value: "roadside_litter", label: "Roadside litter" },
      { value: "market_garbage", label: "Market garbage" },
      { value: "park_waste", label: "Park waste" },
      { value: "public_bin_overflow", label: "Public bin overflow" },
      { value: "damaged_bin", label: "Damaged Bin" },
      { value: "illegal_dump", label: "Illegal Dump" },
    ],
  },
  {
    value: "dead_animal_bio_waste",
    label: "Dead Animal / Bio Waste",
    subcategories: [
      { value: "dead_animals", label: "Dead animals" },
      { value: "animal_remains", label: "Animal remains" },
      { value: "biohazard_material", label: "Biohazard material" },
    ],
  },
  {
    value: "missed_pickup",
    label: "Missed Pickup",
    subcategories: [],
  },
  {
    value: "other",
    label: "Other",
    subcategories: [],
  },
];

export function getCategoryGroup(value) {
  return REPORT_CATEGORY_GROUPS.find((group) => group.value === value);
}

export function getSubcategoryLabel(category, subcategory) {
  const group = getCategoryGroup(category);
  if (!group) return subcategory || "";
  return group.subcategories.find((item) => item.value === subcategory)?.label || subcategory || "";
}

export function formatReportCategory(category, subcategory) {
  const group = getCategoryGroup(category);
  if (!group) {
    return category?.replace(/_/g, " ") || "—";
  }
  if (!subcategory || group.subcategories.length === 0) {
    return group.label;
  }
  const subLabel = getSubcategoryLabel(category, subcategory);
  return subLabel ? `${group.label} — ${subLabel}` : group.label;
}

export function categoryRequiresSubcategory(category) {
  const group = getCategoryGroup(category);
  return Boolean(group?.subcategories?.length);
}
