import { Report } from "../models/Report.js";
import { resolveTeamDisplayName } from "../services/teamRegistryService.js";
import { sendReportNotification } from "../utils/mailer.js";
import {
  notifyResidentsAboutNewReport,
  notifyStatusChange,
  notifyAdminsAboutNewReport,
  notifyReportApproved,
} from "../utils/notifications.js";
import { isWithinDhakaBounds } from "../utils/dhakaBounds.js";
import { inferAreaFromText } from "../utils/dhakaAreas.js";
import { generateUniqueReportId } from "../utils/reportId.js";
import {
  assertResidentNotBlocked,
  logResidentActivity,
  updateReportOutcomeCounts,
} from "../services/residentActivityService.js";

function staffRoles(user) {
  return user.role === "admin" || user.role === "cleaning_crew";
}

const EDITABLE_STATUSES = ["open"];

function assertResidentCanModifyReport(report, user) {
  if (user.role !== "resident") {
    return { ok: false, status: 403, message: "Only residents can modify their own reports here" };
  }
  if (report.reportedBy.toString() !== user._id.toString()) {
    return { ok: false, status: 403, message: "Access denied" };
  }
  if (!EDITABLE_STATUSES.includes(report.status)) {
    return {
      ok: false,
      status: 400,
      message: "Report cannot be edited while it is under review, approved, or rejected",
    };
  }
  return { ok: true };
}

function reportFilterForUser(user) {
  if (user.role === "admin") return {};
  if (user.role === "cleaning_crew") {
    return {
      assignedTeam: user.teamName,
      crewStatus: { $ne: "unassigned" },
    };
  }
  return { reportedBy: user._id };
}
export async function listReports(req, res) {
  try {
    const filter = reportFilterForUser(req.user);
    const reports = await Report.find(filter)
      .populate("reportedBy", "name email phone residentId")
      .sort({ createdAt: -1 });

    const assignedKeys = [
      ...new Set(
        reports.map((r) => r.assignedTeam).filter((t) => t && String(t).trim() !== "")
      ),
    ];
    const labelMap = {};
    await Promise.all(
      assignedKeys.map(async (k) => {
        labelMap[k] = await resolveTeamDisplayName(k);
      })
    );

    const payload = reports.map((r) => {
      const o = r.toObject();
      const hasAssignment =
        o.assignedTeam &&
        o.crewStatus &&
        o.crewStatus !== "unassigned" &&
        o.status !== "rejected";
      o.assignedTeamDisplay = hasAssignment ? labelMap[o.assignedTeam] || o.assignedTeam : "";
      return o;
    });

    res.json({ reports: payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getReport(req, res) {
  try {
    const report = await Report.findById(req.params.id).populate(
      "reportedBy",
      "name email phone residentId"
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const isOwner = report.reportedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isAssignedCrew =
      req.user.role === "cleaning_crew" &&
      report.assignedTeam === req.user.teamName &&
      report.crewStatus !== "unassigned";

    if (!isOwner && !isAdmin && !isAssignedCrew) {
      return res.status(403).json({ message: "Access denied" });
    }

    const o = report.toObject();
    o.updatedTaskReport = {
      description: report.updatedTaskReport?.description ?? "",
      imageUrl: report.updatedTaskReport?.imageUrl ?? "",
      updateDate: report.updatedTaskReport?.updateDate ?? "",
      submittedAt: report.updatedTaskReport?.submittedAt ?? null,
    };
    const hasAssignment =
      o.assignedTeam &&
      o.crewStatus &&
      o.crewStatus !== "unassigned" &&
      o.status !== "rejected";
    o.assignedTeamDisplay = hasAssignment ? await resolveTeamDisplayName(o.assignedTeam) : "";

    res.json({ report: o });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function parseSensitiveLocations(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [String(raw)].filter(Boolean);
  }
}

const VALID_SMELL_RISK = ["no_smell", "mild_odor", "strong_odor", "dangerous"];
const VALID_WASTE_SPREAD = ["less_than_1sqm", "1_to_5sqm", "large_area"];
const VALID_SENSITIVE = ["school", "hospital", "residential_area", "water_body", "market"];

export async function createReport(req, res) {
  try {
    if (req.user.role === "cleaning_crew") {
      return res.status(403).json({ message: "Cleaning crew cannot create reports" });
    }
    if (req.user.role === "resident") {
      await assertResidentNotBlocked(req.user._id);
    }

    const {
      title,
      description,
      category,
      subcategory,
      lat,
      lng,
      address,
      nearbyLandmark,
      smellRisk,
      wasteSpreadArea,
      sensitiveLocations,
    } = req.body;
    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({
        message: "Title and location (lat, lng) are required",
      });
    }
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (smellRisk && !VALID_SMELL_RISK.includes(smellRisk)) {
      return res.status(400).json({ message: "Invalid smell/health risk selection" });
    }
    if (wasteSpreadArea && !VALID_WASTE_SPREAD.includes(wasteSpreadArea)) {
      return res.status(400).json({ message: "Invalid waste spread area selection" });
    }

    const parsedSensitiveLocations = parseSensitiveLocations(sensitiveLocations).filter((value) =>
      VALID_SENSITIVE.includes(value)
    );

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!isWithinDhakaBounds(latitude, longitude)) {
      return res.status(400).json({
        message: "Location must be within Dhaka city",
      });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const reportId = await generateUniqueReportId();

    const report = await Report.create({
      reportId,
      title,      description,
      category,
      subcategory: subcategory || "",
      smellRisk: smellRisk || "",
      wasteSpreadArea: wasteSpreadArea || "",
      sensitiveLocations: parsedSensitiveLocations,
      area: inferAreaFromText(`${address || ""} ${nearbyLandmark || ""}`),
      location: {
        lat: latitude,
        lng: longitude,
        address: address || "",
        nearbyLandmark: nearbyLandmark || "",
      },
      photoUrl,
      reportedBy: req.user._id,
    });

    await report.populate("reportedBy", "name email phone residentId");

    if (req.user.email) {
      sendReportNotification({ to: req.user.email, report }).catch(console.error);
    }

    notifyResidentsAboutNewReport(report.toObject()).catch(console.error);

    if (req.user.role === "resident") {
      await logResidentActivity({
        residentId: req.user._id,
        residentPublicId: req.user.residentId || report.reportedBy?.residentId || "",
        activityType: "report_posted",
        activityLabel: "Posted a report",
        reportId: report._id,
      });
    }

    const created = report.toObject();
    created.assignedTeamDisplay = "";
    res.status(201).json({ report: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateReportStatus(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update report status here" });
    }
    const { status } = req.body;
    const allowed = ["open", "in_progress", "resolved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const now = new Date();
    const updates = { status };

    if (status === "resolved") {
      updates.resolvedAt = now;
    } else if (status === "in_progress") {
      updates.underReviewAt = now;
      updates.resolvedAt = null;
    } else if (status === "open") {
      updates.underReviewAt = null;
      updates.resolvedAt = null;
    } else if (status === "rejected") {
      updates.resolvedAt = null;
      updates.assignedTeam = "";
      updates.teamAssignedAt = null;
      updates.crewStatus = "unassigned";
      updates.approvalRemark = "not_approved";
      updates.assignedTransportRegistration = "";
      updates.assignedTransportLabel = "";
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const previousStatus = report.status;
    Object.assign(report, updates);

    if (status === "resolved" && report.assignedTeam) {
      report.crewStatus = "approved";
    }

    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    await updateReportOutcomeCounts(report.reportedBy._id, previousStatus, status);

    // Notify based on status change
    if (status === "resolved") {
      // When status changes to resolved (approved), notify both resident and crew
      notifyReportApproved(report).catch(console.error);
    } else {
      // For other status changes, send general status change notification
      notifyStatusChange(report).catch(console.error);
    }

    const out = report.toObject();
    const hasAssignment =
      out.assignedTeam &&
      out.crewStatus &&
      out.crewStatus !== "unassigned" &&
      out.status !== "rejected";
    out.assignedTeamDisplay = hasAssignment ? await resolveTeamDisplayName(out.assignedTeam) : "";

    res.json({ report: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateReport(req, res) {
  try {
    if (req.user.role !== "resident") {
      return res.status(403).json({ message: "Only residents can edit reports here" });
    }
    await assertResidentNotBlocked(req.user._id);

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const access = assertResidentCanModifyReport(report, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const {
      title,
      description,
      category,
      subcategory,
      lat,
      lng,
      address,
      nearbyLandmark,
      smellRisk,
      wasteSpreadArea,
      sensitiveLocations,
    } = req.body;

    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({
        message: "Title and location (lat, lng) are required",
      });
    }
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (smellRisk && !VALID_SMELL_RISK.includes(smellRisk)) {
      return res.status(400).json({ message: "Invalid smell/health risk selection" });
    }
    if (wasteSpreadArea && !VALID_WASTE_SPREAD.includes(wasteSpreadArea)) {
      return res.status(400).json({ message: "Invalid waste spread area selection" });
    }

    const parsedSensitiveLocations = parseSensitiveLocations(sensitiveLocations).filter((value) =>
      VALID_SENSITIVE.includes(value)
    );

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!isWithinDhakaBounds(latitude, longitude)) {
      return res.status(400).json({
        message: "Location must be within Dhaka city",
      });
    }

    report.title = title;
    report.description = description || "";
    report.category = category;
    report.subcategory = subcategory || "";
    report.smellRisk = smellRisk || "";
    report.wasteSpreadArea = wasteSpreadArea || "";
    report.sensitiveLocations = parsedSensitiveLocations;
    report.area = inferAreaFromText(`${address || ""} ${nearbyLandmark || ""}`);
    report.location = {
      lat: latitude,
      lng: longitude,
      address: address || "",
      nearbyLandmark: nearbyLandmark || "",
    };

    if (req.file) {
      report.photoUrl = `/uploads/${req.file.filename}`;
    }

    report.createdAt = new Date();
    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    const out = report.toObject();
    const hasAssignment =
      out.assignedTeam &&
      out.crewStatus &&
      out.crewStatus !== "unassigned" &&
      out.status !== "rejected";
    out.assignedTeamDisplay = hasAssignment ? await resolveTeamDisplayName(out.assignedTeam) : "";

    res.json({ report: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteReport(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const isOwner = report.reportedBy.toString() === req.user._id.toString();

    if (req.user.role === "resident") {
      await assertResidentNotBlocked(req.user._id);
      const access = assertResidentCanModifyReport(report, req.user);
      if (!access.ok) {
        return res.status(access.status).json({ message: access.message });
      }
    } else if (!isOwner && !staffRoles(req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await report.deleteOne();
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
