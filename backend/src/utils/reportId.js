import { Report } from "../models/Report.js";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomReportId() {
  let id = "";
  for (let i = 0; i < 5; i += 1) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return id;
}

export async function generateUniqueReportId() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const reportId = randomReportId();
    const exists = await Report.exists({ reportId });
    if (!exists) return reportId;
  }
  throw new Error("Could not generate unique report ID");
}
