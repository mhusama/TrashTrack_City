import { getUserModel } from "../models/User.js";
import {
  buildCrewTeamQuery,
  isTeamLeader,
  isTeamMember,
  normalizeTeamKey,
} from "../utils/crewTeamMatch.js";

const CREW_USER_SAFE_FIELDS = "-password -resetPasswordToken -resetPasswordExpires";

export async function findCrewUsersOnTeam(teamKey) {
  const CrewUser = getUserModel("cleaning_crew");
  const normalized = normalizeTeamKey(teamKey);
  return CrewUser.find(buildCrewTeamQuery(normalized))
    .select(CREW_USER_SAFE_FIELDS)
    .lean();
}

export async function findTeamLeaderRecord(teamKey) {
  const crewOnTeam = await findCrewUsersOnTeam(teamKey);
  return crewOnTeam.find(isTeamLeader) || null;
}

export async function findTeamMembersOnly(teamKey) {
  const crewOnTeam = await findCrewUsersOnTeam(teamKey);
  return crewOnTeam.filter(isTeamMember);
}

export async function getDistinctNormalizedTeamKeys() {
  const CrewUser = getUserModel("cleaning_crew");
  const raw = await CrewUser.distinct("teamName", {
    teamName: { $exists: true, $nin: ["", null] },
  });
  const normalized = raw
    .map((name) => normalizeTeamKey(name))
    .filter(Boolean);
  return [...new Set(normalized)];
}

export { CREW_USER_SAFE_FIELDS, normalizeTeamKey };
