export const DHAKA_AREAS = [
  "Gulshan",
  "Banani",
  "Baridhara",
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Motijheel",
  "Old Dhaka",
  "Mohammadpur",
  "Bashundhara",
  "Tejgaon",
  "Farmgate",
  "Wari",
  "Lalbagh",
  "Rampura",
  "Badda",
  "Khilgaon",
  "Jatrabari",
  "Shyamoli",
  "Kallyanpur",
  "Green Road",
  "Elephant Road",
  "Malibagh",
  "Azimpur",
  "Niketon",
  "Cantonment",
  "Pallabi",
  "Kafrul",
  "Keraniganj",
  "Other",
];

export function inferAreaFromText(text = "") {
  const haystack = String(text).toLowerCase();

  for (const area of DHAKA_AREAS) {
    if (area === "Other") {
      continue;
    }
    if (haystack.includes(area.toLowerCase())) {
      return area;
    }
  }

  return "Other";
}

export function resolveReportArea(report) {
  if (!report) return "Other";
  if (report.area && report.area !== "Other") {
    return report.area;
  }
  const loc = report.location || {};
  return inferAreaFromText(`${loc.address || ""} ${loc.nearbyLandmark || ""}`);
}
