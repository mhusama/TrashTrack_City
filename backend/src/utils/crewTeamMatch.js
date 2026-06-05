/** Normalize "Team 9", "team9", "Team 09", bare "9" → "Team 9" */
export function normalizeTeamKey(name) {
  if (name === null || name === undefined) return "";
  const trimmed = String(name).trim();
  if (!trimmed) return "";

  const numbered = /^Team\s*0*(\d+)\b/i.exec(trimmed);
  if (numbered) {
    return `Team ${parseInt(numbered[1], 10)}`;
  }

  const bareNumber = /^(\d+)$/.exec(trimmed);
  if (bareNumber) {
    return `Team ${parseInt(bareNumber[1], 10)}`;
  }

  return trimmed;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Match crew users on a team — tolerates manual MongoDB inserts
 * (e.g. "Team9", "team 10", "Team 10 – Team Uddog", missing role field).
 */
export function buildCrewTeamQuery(teamKey) {
  const normalized = normalizeTeamKey(teamKey);
  if (!normalized) {
    return { teamName: "__no_such_team__" };
  }

  const numbered = /^Team\s*(\d+)$/i.exec(normalized);
  const teamNumber = numbered ? numbered[1] : null;
  const escaped = escapeRegex(normalized);

  const teamNameVariants = [
    { teamName: normalized },
    { teamName: { $regex: new RegExp(`^${escaped}(\\s|–|-|$)`, "i") } },
  ];

  if (teamNumber) {
    const n = parseInt(teamNumber, 10);
    teamNameVariants.push(
      { teamName: { $regex: new RegExp(`^Team\\s*0*${teamNumber}$`, "i") } },
      { teamName: `Team${teamNumber}` },
      { teamName: `team ${teamNumber}` },
      { teamName: `team${teamNumber}` },
      { teamName: teamNumber },
      { teamName: n }
    );
  }

  // c_c.users only holds crew accounts — match by team name, not role (manual inserts often omit role).
  return { $or: teamNameVariants };
}

export function isTeamLeader(user) {
  const sub = String(user?.crewSubRole || "").trim().toLowerCase();
  if (!sub) return false;
  if (sub === "team_member" || sub === "team member" || sub === "member") return false;
  return (
    sub === "team_leader" ||
    sub === "team leader" ||
    sub === "leader" ||
    sub.includes("leader")
  );
}

export function isTeamMember(user) {
  return !isTeamLeader(user);
}
