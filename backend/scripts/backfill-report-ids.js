import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import { Report } from "../src/models/Report.js";
import { generateUniqueReportId } from "../src/utils/reportId.js";

function missingReportId(value) {
  return value == null || String(value).trim() === "";
}

async function main() {
  await connectDB();

  const reports = await Report.find({
    $or: [{ reportId: { $exists: false } }, { reportId: null }, { reportId: "" }],
  })
    .select("_id title reportId createdAt")
    .sort({ createdAt: 1 })
    .lean();

  let updated = 0;
  for (const report of reports) {
    if (!missingReportId(report.reportId)) continue;
    const reportId = await generateUniqueReportId();
    await Report.updateOne({ _id: report._id }, { $set: { reportId } });
    updated += 1;
    console.log(`${report._id}: ${reportId} (${report.title || "Untitled"})`);
  }

  console.log("\nDone.");
  console.log(`Reports updated: ${updated} (scanned ${reports.length} missing)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
