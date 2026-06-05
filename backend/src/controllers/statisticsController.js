import { Report } from "../models/Report.js";
import { computeReportSeverity, severityLabel, SEVERITY_WEIGHT } from "../utils/heatmapSeverity.js";
import {
  dominantWasteLabel,
  normalizeWasteTypeId,
  reportMatchesWasteType,
} from "../utils/heatmapWasteTypes.js";
import { inferAreaFromText } from "../utils/dhakaAreas.js";

const TIME_RANGES = ["today", "last_7_days", "this_month", "last_3_months", "all_time"];
const SEVERITIES = ["low", "medium", "high", "emergency", "all"];

function timeRangeStart(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "last_7_days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "this_month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "last_3_months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    default:
      return null;
  }
}

function gridKey(lat, lng, precision = 2) {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
}

function formatAreaName(report) {
  if (report.area && report.area !== "Other") return report.area;
  const loc = report.location || {};
  const inferred = inferAreaFromText(
    `${loc.address || ""} ${loc.nearbyLandmark || ""}`
  );
  return inferred || "Unknown area";
}

export async function getHeatmapStatistics(req, res) {
  try {
    const wasteType = normalizeWasteTypeId(String(req.query.wasteType || "all").trim());
    const timeRange = TIME_RANGES.includes(req.query.timeRange)
      ? req.query.timeRange
      : "all_time";
    const severityFilter = SEVERITIES.includes(req.query.severity)
      ? req.query.severity
      : "all";

    const since = timeRangeStart(timeRange);
    const mongoFilter = { status: { $ne: "rejected" } };
    if (since) {
      mongoFilter.createdAt = { $gte: since };
    }

    const reports = await Report.find(mongoFilter)
      .select(
        "category subcategory smellRisk wasteSpreadArea sensitiveLocations location area createdAt resolvedAt teamAssignedAt crewStatus status title reportId"
      )
      .lean();

    const filtered = reports.filter((r) => {
      if (!reportMatchesWasteType(r, wasteType)) return false;
      const sev = computeReportSeverity(r);
      if (severityFilter !== "all" && sev !== severityFilter) return false;
      const lat = r.location?.lat;
      const lng = r.location?.lng;
      return typeof lat === "number" && typeof lng === "number";
    });

    const totalComplaints = filtered.length;

    const areaCounts = {};
    const categoryCounts = {};
    let responseHoursSum = 0;
    let responseCount = 0;
    let activeCleaning = 0;

    for (const r of filtered) {
      const areaName = formatAreaName(r);
      areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;

      if (["assigned", "disposal_in_progress"].includes(r.crewStatus)) {
        activeCleaning += 1;
      }

      if (r.status === "resolved" && r.resolvedAt && r.createdAt) {
        const ms = new Date(r.resolvedAt) - new Date(r.createdAt);
        if (ms > 0) {
          responseHoursSum += ms / (1000 * 60 * 60);
          responseCount += 1;
        }
      }
    }

    let mostPollutedArea = "—";
    let maxArea = 0;
    for (const [area, count] of Object.entries(areaCounts)) {
      if (count > maxArea) {
        maxArea = count;
        mostPollutedArea = area;
      }
    }

    let mostCommonCategory = "";
    let maxCat = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCat) {
        maxCat = count;
        mostCommonCategory = cat;
      }
    }

    const maxCount = Math.max(1, ...Object.values(areaCounts), 1);
    const grid = new Map();

    for (const r of filtered) {
      const lat = r.location.lat;
      const lng = r.location.lng;
      const key = gridKey(lat, lng);
      const sev = computeReportSeverity(r);
      const weight = SEVERITY_WEIGHT[sev] || 0.5;

      if (!grid.has(key)) {
        grid.set(key, {
          lat: Number(lat.toFixed(3)),
          lng: Number(lng.toFixed(3)),
          count: 0,
          weightSum: 0,
          categories: {},
          severities: {},
          lastComplaintAt: null,
          areas: {},
        });
      }
      const cell = grid.get(key);
      cell.count += 1;
      cell.weightSum += weight;
      cell.categories[r.category] = (cell.categories[r.category] || 0) + 1;
      cell.severities[sev] = (cell.severities[sev] || 0) + 1;
      const areaName = formatAreaName(r);
      cell.areas[areaName] = (cell.areas[areaName] || 0) + 1;
      const created = new Date(r.createdAt);
      if (!cell.lastComplaintAt || created > cell.lastComplaintAt) {
        cell.lastComplaintAt = created;
      }
    }

    const hotspots = [];
    const heatPoints = [];

    for (const cell of grid.values()) {
      const intensity = Math.min(1, cell.count / Math.max(3, maxCount * 0.15));
      const dominantCategory = Object.entries(cell.categories).sort((a, b) => b[1] - a[1])[0]?.[0];
      const dominantSeverity = Object.entries(cell.severities).sort((a, b) => b[1] - a[1])[0]?.[0];
      const dominantArea = Object.entries(cell.areas).sort((a, b) => b[1] - a[1])[0]?.[0];

      heatPoints.push([cell.lat, cell.lng, Math.max(0.15, intensity * (cell.weightSum / cell.count))]);

      hotspots.push({
        lat: cell.lat,
        lng: cell.lng,
        count: cell.count,
        dominantWasteType: dominantWasteLabel(dominantCategory),
        severity: dominantSeverity,
        severityLabel: severityLabel(dominantSeverity),
        lastComplaintAt: cell.lastComplaintAt?.toISOString() ?? null,
        area: dominantArea,
      });
    }

    res.json({
      summary: {
        totalComplaints,
        mostPollutedArea: totalComplaints ? mostPollutedArea : "—",
        mostCommonWasteType: mostCommonCategory
          ? dominantWasteLabel(mostCommonCategory)
          : "—",
        averageResponseTimeHours:
          responseCount > 0 ? Math.round((responseHoursSum / responseCount) * 10) / 10 : null,
        activeCleaningOperations: activeCleaning,
      },
      heatPoints,
      hotspots: hotspots.sort((a, b) => b.count - a.count),
      filters: { wasteType, timeRange, severity: severityFilter },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
