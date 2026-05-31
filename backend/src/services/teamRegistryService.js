import { TeamRegistry } from "../models/TeamRegistry.js";
import { TEAM_NAMES, staticTeamDisplayName } from "../config/teams.js";

export async function getDynamicTeamKeysSorted() {
  const docs = await TeamRegistry.find().sort({ createdAt: 1 }).select("teamKey").lean();
  return docs.map((d) => d.teamKey);
}

export async function getAllTeamKeysOrdered() {
  const dynamic = await getDynamicTeamKeysSorted();
  return [...TEAM_NAMES, ...dynamic];
}

export async function resolveTeamDisplayName(teamKey) {
  if (!teamKey || typeof teamKey !== "string") return "—";
  const trimmed = teamKey.trim();
  const doc = await TeamRegistry.findOne({ teamKey: trimmed }).lean();
  if (doc) return `${trimmed} – ${doc.customName}`;
  return staticTeamDisplayName(trimmed);
}

export async function isValidTeamName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (TEAM_NAMES.includes(trimmed)) return true;
  const found = await TeamRegistry.findOne({ teamKey: trimmed }).lean();
  return !!found;
}

/**
 * Admin adds a new team. teamKey = `Team ${teamNumber}`.
 * Cannot duplicate built-in Team 1–15 or an existing registry row.
 */
export async function enrollAdminTeam({ teamNumber, customName }) {
  const n = Number(teamNumber);
  if (!Number.isInteger(n) || n < 1) {
    return { ok: false, status: 400, message: "Team no. must be a positive integer" };
  }
  if (!customName || !String(customName).trim()) {
    return { ok: false, status: 400, message: "Team name is required" };
  }

  const teamKey = `Team ${n}`;
  if (TEAM_NAMES.includes(teamKey)) {
    return {
      ok: false,
      status: 400,
      message: "Teams 1–15 are already defined. Use a new team number (16 or higher).",
    };
  }

  const exists = await TeamRegistry.findOne({ teamKey }).lean();
  if (exists) {
    return { ok: false, status: 409, message: "That team number is already enrolled" };
  }

  await TeamRegistry.create({ teamKey, customName: String(customName).trim() });
  return { ok: true, teamKey };
}

export async function getTeamRegisterOptions() {
  const dynamic = await TeamRegistry.find().sort({ createdAt: 1 }).lean();
  const staticOptions = TEAM_NAMES.map((teamKey) => ({
    value: teamKey,
    label: staticTeamDisplayName(teamKey),
  }));
  const extra = dynamic.map((d) => ({
    value: d.teamKey,
    label: `${d.teamKey} – ${d.customName}`,
  }));
  return [...staticOptions, ...extra];
}
