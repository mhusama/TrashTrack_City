import { getUserModel } from "../models/User.js";

export async function findTeamLeader(teamName) {
  if (!teamName?.trim()) return null;
  const CrewUser = getUserModel("cleaning_crew");
  return CrewUser.findOne({
    role: "cleaning_crew",
    crewSubRole: "team_leader",
    teamName: teamName.trim(),
  });
}

/** Recalculate team leader average rating after resident feedback. */
export async function applyTeamLeaderRating(teamName, newRating) {
  const leader = await findTeamLeader(teamName);
  if (!leader) return null;

  const count = leader.reviewedBy || 0;
  const currentAvg = leader.rating || 0;
  const nextCount = count + 1;
  const nextAvg = (currentAvg * count + newRating) / nextCount;

  leader.reviewedBy = nextCount;
  leader.rating = Math.round(nextAvg * 100) / 100;
  await leader.save();

  return leader;
}

/** Remove one review from the team leader aggregate. */
export async function removeTeamLeaderRating(teamName, removedRating) {
  const leader = await findTeamLeader(teamName);
  if (!leader) return null;

  const count = leader.reviewedBy || 0;
  if (count <= 0) return leader;

  const currentAvg = leader.rating || 0;
  const nextCount = count - 1;

  if (nextCount <= 0) {
    leader.reviewedBy = 0;
    leader.rating = 0;
  } else {
    leader.rating =
      Math.round(((currentAvg * count - removedRating) / nextCount) * 100) / 100;
    leader.reviewedBy = nextCount;
  }

  await leader.save();
  return leader;
}

/** Adjust team leader average when a review rating changes. */
export async function updateTeamLeaderRating(teamName, oldRating, newRating) {
  const leader = await findTeamLeader(teamName);
  if (!leader) return null;

  const count = leader.reviewedBy || 0;
  if (count <= 0) return leader;

  const currentAvg = leader.rating || 0;
  leader.rating =
    Math.round(((currentAvg * count - oldRating + newRating) / count) * 100) / 100;
  await leader.save();

  return leader;
}
