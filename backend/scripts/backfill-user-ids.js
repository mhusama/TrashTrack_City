/**
 * One-time backfill: assign residentId (RS + 6) to residents without one,
 * and teamId (T{n} + suffix) to cleaning crew without one.
 *
 * Run from backend folder: npm run backfill:user-ids
 * Requires MONGODB_URI (and optional MONGODB_DB_NAME, MONGODB_URI_CREW, etc.)
 */
import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import { initUserModels, getUserModel } from "../src/models/User.js";
import { generateResidentIdCandidate, generateTeamIdCandidate } from "../src/utils/userIds.js";

function needsId(value) {
  return value == null || String(value).trim() === "";
}

async function pickUniqueResidentId(ResidentModel) {
  for (let i = 0; i < 40; i += 1) {
    const id = generateResidentIdCandidate();
    const clash = await ResidentModel.findOne({ residentId: id }).select("_id").lean();
    if (!clash) return id;
  }
  throw new Error("Could not allocate a unique residentId");
}

async function pickUniqueTeamId(CrewModel, teamName) {
  for (let i = 0; i < 40; i += 1) {
    const id = generateTeamIdCandidate(teamName);
    const clash = await CrewModel.findOne({ teamId: id }).select("_id").lean();
    if (!clash) return id;
  }
  throw new Error("Could not allocate a unique teamId");
}

async function main() {
  await connectDB();
  initUserModels();

  const ResidentModel = getUserModel("resident");
  const CrewModel = getUserModel("cleaning_crew");

  const residentQuery = {
    role: { $ne: "admin" },
    $or: [
      { residentId: { $exists: false } },
      { residentId: null },
      { residentId: "" },
    ],
  };

  const residents = await ResidentModel.find(residentQuery).select("_id email name role residentId").lean();

  let residentUpdated = 0;
  for (const u of residents) {
    if (!needsId(u.residentId)) continue;
    const residentId = await pickUniqueResidentId(ResidentModel);
    await ResidentModel.updateOne({ _id: u._id }, { $set: { residentId } });
    residentUpdated += 1;
    console.log(`Resident ${u.email}: ${residentId}`);
  }

  const crewQuery = {
    role: "cleaning_crew",
    $or: [{ teamId: { $exists: false } }, { teamId: null }, { teamId: "" }],
  };

  const crew = await CrewModel.find(crewQuery).select("_id email name teamName crewSubRole teamId").lean();

  let crewUpdated = 0;
  for (const u of crew) {
    if (!needsId(u.teamId)) continue;
    const teamId = await pickUniqueTeamId(CrewModel, u.teamName || "");
    await CrewModel.updateOne({ _id: u._id }, { $set: { teamId } });
    crewUpdated += 1;
    console.log(`Crew ${u.email} (${u.crewSubRole}, ${u.teamName || "no team"}): ${teamId}`);
  }

  console.log("\nDone.");
  console.log(`Residents updated: ${residentUpdated} (scanned ${residents.length} missing)`);
  console.log(`Crew updated: ${crewUpdated} (scanned ${crew.length} missing)`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
