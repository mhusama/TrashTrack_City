import { TEAM_LOCATION_AREAS } from "../config/dhakaAreas.js";
import { staticTeamDisplayName } from "../config/teams.js";
import { TeamLocation } from "../models/TeamLocation.js";

function formatTeamLocation(doc) {
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(row._id),
    teamId: row.teamId,
    name: row.name,
    teamDisplayLabel: staticTeamDisplayName(row.name),
    areas: Array.isArray(row.areas) ? row.areas : [],
    updatedAt: row.updatedAt,
  };
}

function normalizeAreas(areas) {
  if (!Array.isArray(areas)) return null;
  const normalized = [...new Set(areas.map((area) => String(area).trim()).filter(Boolean))];
  if (normalized.length === 0) return null;

  const invalid = normalized.filter((area) => !TEAM_LOCATION_AREAS.includes(area));
  if (invalid.length > 0) {
    return { error: `Invalid areas: ${invalid.join(", ")}` };
  }

  return { areas: normalized };
}

export async function listTeamLocations(req, res) {
  try {
    const docs = await TeamLocation.find().sort({ teamId: 1 }).lean();
    res.json({ locations: docs.map(formatTeamLocation) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateTeamLocation(req, res) {
  try {
    const parsed = normalizeAreas(req.body?.areas);
    if (!parsed) {
      return res.status(400).json({ message: "Select at least one valid area" });
    }
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const doc = await TeamLocation.findByIdAndUpdate(
      req.params.id,
      { areas: parsed.areas },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ message: "Team location not found" });
    }

    res.json({ location: formatTeamLocation(doc) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
