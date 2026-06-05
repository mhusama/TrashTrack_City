import { TeamRegistry } from "../models/TeamRegistry.js";
import {
  TEAM_NAMES,
  isExcludedTeam,
  staticTeamDisplayName,
} from "../config/teams.js";
import { getDistinctNormalizedTeamKeys, normalizeTeamKey } from "./crewTeamUserService.js";

export async function getDynamicTeamKeysSorted() {
  const docs = await TeamRegistry.find().sort({ createdAt: 1 }).select("teamKey customName").lean();
  return docs
    .filter((d) => !isExcludedTeam(d.teamKey, d.customName))
    .map((d) => d.teamKey);
}

/** Distinct team keys from crew users in the c_c database (normalized to "Team N"). */
export async function getCrewUserTeamNames() {
  const names = await getDistinctNormalizedTeamKeys();
  return names.filter((n) => !isExcludedTeam(n));
}

export async function getAllTeamKeysOrdered() {
  const dynamic = await getDynamicTeamKeysSorted();
  const fromUsers = await getCrewUserTeamNames();
  const seen = new Set();
  const ordered = [];

  for (const key of [...TEAM_NAMES, ...dynamic, ...fromUsers]) {
    if (!key || seen.has(key) || isExcludedTeam(key)) continue;
    seen.add(key);
    ordered.push(key);
  }

  return ordered;
}

export async function resolveTeamDisplayName(teamKey) {
  if (!teamKey || typeof teamKey !== "string") return "—";
  if (isExcludedTeam(teamKey)) return "—";
  const trimmed = teamKey.trim();
  const doc = await TeamRegistry.findOne({ teamKey: trimmed }).lean();
  if (doc) {
    if (isExcludedTeam(doc.teamKey, doc.customName)) return "—";
    return `${trimmed} – ${doc.customName}`;
  }
  return staticTeamDisplayName(trimmed);
}

export async function isValidTeamName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = normalizeTeamKey(name);
  if (isExcludedTeam(trimmed)) return false;
  if (TEAM_NAMES.includes(trimmed)) return true;
  const found = await TeamRegistry.findOne({ teamKey: trimmed }).lean();
  if (found && isExcludedTeam(found.teamKey, found.customName)) return false;
  if (found) return true;
  const crewNames = await getCrewUserTeamNames();
  return crewNames.includes(trimmed);
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
  if (isExcludedTeam(`Team ${n}`, String(customName).trim())) {
    return { ok: false, status: 400, message: "That team name is not allowed" };
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
  const extra = dynamic
    .filter((d) => !isExcludedTeam(d.teamKey, d.customName))
    .map((d) => ({
      value: d.teamKey,
      label: `${d.teamKey} – ${d.customName}`,
    }));
  return [...staticOptions, ...extra];
}

/** Remove excluded teams from TeamRegistry (e.g. Team Usama). */
export async function purgeExcludedTeamsFromRegistry() {
  const docs = await TeamRegistry.find().lean();
  let removed = 0;
  for (const doc of docs) {
    if (isExcludedTeam(doc.teamKey, doc.customName)) {
      await TeamRegistry.deleteOne({ _id: doc._id });
      removed += 1;
      console.log(`[teams] Removed excluded team: ${doc.teamKey} (${doc.customName})`);
    }
  }
  return removed;
}
