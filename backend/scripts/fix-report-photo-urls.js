/**
 * Ensures report cards only use photos uploaded with the report — never NID/profile/chat copies.
 * - Removes photoUrl when the file is missing or matches a reserved (NID/profile) upload.
 * - Deletes wrongly copied files that duplicate reserved uploads.
 *
 * Run: node scripts/fix-report-photo-urls.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../src/config/db.js";
import { getUserModel, initUserModels } from "../src/models/User.js";
import { Report } from "../src/models/Report.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../uploads");

function fileKey(url) {
  if (!url) return "";
  return url.replace(/^\/uploads\//, "").trim();
}

function fileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

await connectDB();
initUserModels();
const reserved = new Set();
const reservedBuffers = new Map();

async function collectFromUsers(Model) {
  const users = await Model.find({})
    .select("profilePicture nidFrontImage nidBackImage")
    .lean();
  for (const u of users) {
    for (const field of [u.profilePicture, u.nidFrontImage, u.nidBackImage]) {
      const key = fileKey(field);
      if (!key) continue;
      reserved.add(key);
      const full = path.join(uploadDir, key);
      if (fs.existsSync(full) && !reservedBuffers.has(key)) {
        reservedBuffers.set(key, fileHash(full));
      }
    }
  }
}

await collectFromUsers(getUserModel("resident"));
await collectFromUsers(getUserModel("admin"));
await collectFromUsers(getUserModel("cleaning_crew"));

const reports = await Report.find({}).select("title photoUrl createdAt");
let cleared = 0;
let kept = 0;
let deletedCopies = 0;

for (const report of reports) {
  const key = fileKey(report.photoUrl);
  if (!key) continue;

  const full = path.join(uploadDir, key);
  const inReservedList = reserved.has(key);
  let isDuplicateOfReserved = false;

  if (fs.existsSync(full)) {
    const buf = fileHash(full);
    for (const [, reservedBuf] of reservedBuffers) {
      if (reservedBuf && buf && reservedBuf.equals(buf)) {
        isDuplicateOfReserved = true;
        break;
      }
    }
  }

  const fileMissing = !fs.existsSync(full);
  const shouldClear = inReservedList || isDuplicateOfReserved || fileMissing;

  if (shouldClear) {
    if (fs.existsSync(full) && (isDuplicateOfReserved || inReservedList)) {
      fs.unlinkSync(full);
      deletedCopies += 1;
    }
    report.photoUrl = "";
    await report.save();
    cleared += 1;
    console.log(
      `Cleared photoUrl: ${report.title} (${fileMissing ? "missing" : inReservedList ? "reserved path" : "NID/profile duplicate"})`
    );
  } else {
    kept += 1;
  }
}

// Second pass: same image bytes reused across multiple reports (bad repair copies).
const withPhoto = await Report.find({ photoUrl: { $ne: "" } })
  .select("title photoUrl createdAt")
  .sort({ createdAt: 1 });

const byContent = new Map();
for (const report of withPhoto) {
  const key = fileKey(report.photoUrl);
  const full = path.join(uploadDir, key);
  if (!fs.existsSync(full)) continue;
  const buf = fileHash(full);
  const sig = buf.toString("base64");
  if (!byContent.has(sig)) byContent.set(sig, []);
  byContent.get(sig).push({ report, key, full });
}

for (const group of byContent.values()) {
  if (group.length < 2) continue;
  const keys = new Set(group.map((g) => g.key));
  if (keys.size < 2) continue;

  const [owner, ...dupes] = group;
  for (const { report, full, key } of dupes) {
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
      deletedCopies += 1;
    }
    report.photoUrl = "";
    await report.save();
    cleared += 1;
    kept -= 1;
    console.log(`Cleared duplicate report photo: ${report.title} (copy of ${owner.report.title})`);
  }
}

console.log(`Done. kept=${kept} cleared=${cleared} deletedCopies=${deletedCopies}`);
process.exit(0);
