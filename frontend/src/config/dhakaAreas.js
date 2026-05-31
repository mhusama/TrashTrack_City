/** Major areas / neighbourhoods in Dhaka city for report filtering. */
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

export function inferReportArea(report) {
  if (report.area) {
    return report.area;
  }

  const haystack = `${report.location?.address || ""} ${report.title || ""} ${report.description || ""}`.toLowerCase();

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
