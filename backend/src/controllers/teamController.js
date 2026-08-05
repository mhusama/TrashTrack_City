import { Report } from "../models/Report.js";
import { TeamLocation } from "../models/TeamLocation.js";
import { getFileUrl } from "../utils/fileUrl.js";
import { resolveReportArea } from "../utils/dhakaAreas.js";
import { getUserModel } from "../models/User.js";
import { MAX_TEAM_ASSIGNMENTS } from "../config/teams.js";
import {
  enrollAdminTeam,
  getAllTeamKeysOrdered,
  getTeamRegisterOptions,
  isValidTeamName,
  resolveTeamDisplayName,
} from "../services/teamRegistryService.js";
import {
  CREW_USER_SAFE_FIELDS,
  findCrewUsersOnTeam,
  findTeamLeaderRecord,
  normalizeTeamKey,
} from "../services/crewTeamUserService.js";
import { isTeamLeader } from "../utils/crewTeamMatch.js";
import {
  notifyReportApproved,
  notifyReportAssigned,
  notifyStatusChange,
} from "../utils/notifications.js";
import { updateReportOutcomeCounts } from "../services/residentActivityService.js";

function isActiveTeamAssignment(report) {
  return (
    Boolean(report.assignedTeam && String(report.assignedTeam).trim()) &&
    report.status !== "resolved" &&
    report.status !== "rejected"
  );
}

/** Assigned to the team and not resolved/rejected. */
async function countActiveTeamAssignments(teamName, excludeReportId = null) {
  const filter = {
    assignedTeam: teamName,
    status: { $nin: ["resolved", "rejected"] },
  };
  if (excludeReportId) {
    filter._id = { $ne: excludeReportId };
  }
  return Report.countDocuments(filter);
}

/** When checking capacity, exclude the current report only if it already counts toward this team. */
function capacityExcludeReportId(report, teamName) {
  if (!report?._id) return null;
  if (isActiveTeamAssignment(report) && report.assignedTeam === teamName) {
    return report._id;
  }
  return null;
}

async function countPendingApprovals(teamName) {
  return Report.countDocuments({
    assignedTeam: teamName,
    crewStatus: "awaiting_approval",
    status: { $nin: ["resolved", "rejected"] },
  });
}

async function countApprovedReports(teamName) {
  return Report.countDocuments({
    assignedTeam: teamName,
    status: "resolved",
  });
}

async function getTeamLeaderName(teamName) {
  const leader = await findTeamLeaderRecord(teamName);
  return leader?.name || "—";
}

function formatCrewUser(user) {
  if (!user) return null;
  const doc = typeof user.toObject === "function" ? user.toObject() : user;
  return {
    id: doc._id?.toString?.() || String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone || "",
    role: doc.role,
    crewSubRole: doc.crewSubRole || "",
    teamName: doc.teamName || "",
    teamId: doc.teamId || "",
    profilePicture: doc.profilePicture || "",
    nidNumber: doc.nidNumber || "",
    nidFrontImage: doc.nidFrontImage || "",
    nidBackImage: doc.nidBackImage || "",
    rating: doc.rating ?? 0,
    reviewedBy: doc.reviewedBy ?? 0,
    blocked: Boolean(doc.blocked),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function formatCrewUserWithTeamLabel(user) {
  const formatted = formatCrewUser(user);
  if (!formatted) return null;
  if (formatted.teamName) {
    formatted.teamDisplayLabel = await resolveTeamDisplayName(formatted.teamName);
  } else {
    formatted.teamDisplayLabel = "";
  }
  return formatted;
}

async function countTeamReports(teamName, crewStatusFilter, excludeReportId = null) {
  const filter = { assignedTeam: teamName };
  if (crewStatusFilter) {
    if (Array.isArray(crewStatusFilter)) {
      filter.crewStatus = { $in: crewStatusFilter };
    } else {
      filter.crewStatus = crewStatusFilter;
    }
  }
  if (excludeReportId) {
    filter._id = { $ne: excludeReportId };
  }
  return Report.countDocuments(filter);
}

export async function getTeamRegisterOptionsHandler(req, res) {
  try {
    const teams = await getTeamRegisterOptions();
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function enrollTeamByAdmin(req, res) {
  try {
    const { teamNumber, teamName } = req.body;
    if (teamNumber === undefined || teamNumber === null || String(teamNumber).trim() === "") {
      return res.status(400).json({ message: "Team no. is required" });
    }
    if (!teamName?.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const result = await enrollAdminTeam({
      teamNumber,
      customName: String(teamName).trim(),
    });
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json({ message: "Team enrolled successfully", teamKey: result.teamKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTeamsOverview(req, res) {
  try {
    const keys = await getAllTeamKeysOrdered();
    const teams = await Promise.all(
      keys.map(async (teamName) => {
        const leader = await findTeamLeaderRecord(teamName);
        const [assignedTasks, disposalInProgress, pendingApproval, approvedReports, teamDisplayLabel] =
          await Promise.all([
            countActiveTeamAssignments(teamName),
            countTeamReports(teamName, "disposal_in_progress"),
            countPendingApprovals(teamName),
            countApprovedReports(teamName),
            resolveTeamDisplayName(teamName),
          ]);

        const atCapacity = assignedTasks >= MAX_TEAM_ASSIGNMENTS;

        return {
          teamName,
          teamDisplayLabel,
          teamLeader: leader?.name || "—",
          teamLeaderId: leader?._id?.toString?.() || (leader?._id ? String(leader._id) : null),
          leaderTeamId: leader?.teamId || "",
          assignedTasks,
          disposalInProgress,
          pendingApproval,
          approvedReports,
          atCapacity,
          availability: atCapacity ? "Not available" : "Available",
        };
      })
    );

    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTeamMembers(req, res) {
  try {
    const teamKey = normalizeTeamKey(req.params.teamName);
    if (!(await isValidTeamName(teamKey))) {
      return res.status(400).json({ message: "Invalid team name" });
    }

    const crewOnTeam = await findCrewUsersOnTeam(teamKey);
    const leader = crewOnTeam.find(isTeamLeader) || (await findTeamLeaderRecord(teamKey));
    const leaderId = leader?._id ? String(leader._id) : null;
    const members = leaderId
      ? crewOnTeam.filter((user) => String(user._id) !== leaderId)
      : crewOnTeam;

    res.json({
      teamName: teamKey,
      leader: await formatCrewUserWithTeamLabel(leader),
      members: await Promise.all(members.map((m) => formatCrewUserWithTeamLabel(m))),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCrewUserCredentials(req, res) {
  try {
    const CrewUser = getUserModel("cleaning_crew");
    const user = await CrewUser.findById(req.params.userId).select(CREW_USER_SAFE_FIELDS);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: await formatCrewUserWithTeamLabel(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAssignmentTable(req, res) {
  try {
    const { reportId } = req.query;
    const report = reportId
      ? await Report.findById(reportId)
          .select("assignedTeam status area location crewStatus")
          .lean()
      : null;
    const reportArea = resolveReportArea(report);
    const keys = await getAllTeamKeysOrdered();

    const locationDocs = await TeamLocation.find().select("name areas").lean();
    const areasByTeam = new Map(
      locationDocs.map((doc) => [doc.name, Array.isArray(doc.areas) ? doc.areas : []])
    );

    const teams = await Promise.all(
      keys.map(async (teamName) => {
        const assignedTasks = await countActiveTeamAssignments(teamName);
        const excludeForCapacity = capacityExcludeReportId(report, teamName);
        const activeForCapacity = await countActiveTeamAssignments(
          teamName,
          excludeForCapacity
        );
        const alreadyOnTeam =
          report &&
          isActiveTeamAssignment(report) &&
          report.assignedTeam === teamName;
        const atCapacity = activeForCapacity >= MAX_TEAM_ASSIGNMENTS;
        const teamLeader = await getTeamLeaderName(teamName);
        const displayLabel = await resolveTeamDisplayName(teamName);
        const locations = areasByTeam.get(teamName) || [];
        const areaMatch =
          reportArea !== "Other" && locations.includes(reportArea);

        return {
          teamName,
          displayLabel,
          teamLeader,
          locations,
          areaMatch,
          assignedTasks,
          availability: atCapacity && !alreadyOnTeam ? "Not available" : "Available",
          canAssign: !atCapacity || alreadyOnTeam,
        };
      })
    );

    teams.sort((a, b) => {
      if (a.areaMatch !== b.areaMatch) {
        return Number(b.areaMatch) - Number(a.areaMatch);
      }
      if (a.canAssign !== b.canAssign) {
        return Number(b.canAssign) - Number(a.canAssign);
      }
      return a.displayLabel.localeCompare(b.displayLabel);
    });

    res.json({ teams, reportArea });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function assignReportToTeam(req, res) {
  try {
    const { id } = req.params;
    const { teamName } = req.body;

    if (!(await isValidTeamName(teamName))) {
      return res.status(400).json({ message: "Invalid team name" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status === "resolved" || report.status === "rejected") {
      return res.status(400).json({
        message: "Cannot assign teams to approved or rejected reports",
      });
    }

    const previousTeam = report.assignedTeam;
    const isActiveAssignment = isActiveTeamAssignment(report);

    if (isActiveAssignment && previousTeam === teamName) {
      await report.populate("reportedBy", "name email phone residentId");
      const out = report.toObject();
      out.assignedTeamDisplay = await resolveTeamDisplayName(out.assignedTeam);
      return res.json({ report: out });
    }

    const assignedTasks = await countActiveTeamAssignments(
      teamName,
      capacityExcludeReportId(report, teamName)
    );
    if (assignedTasks >= MAX_TEAM_ASSIGNMENTS) {
      return res.status(400).json({ message: "This team already has 3 active assignments" });
    }

    if (previousTeam && previousTeam !== teamName) {
      report.updatedTaskReport = {
        description: "",
        imageUrl: "",
        updateDate: "",
        submittedAt: null,
      };
      report.approvalRemark = "not_approved";
      report.assignedTransportRegistration = "";
      report.assignedTransportLabel = "";
    }

    report.assignedTeam = teamName;
    report.crewStatus = "assigned";
    report.teamAssignedAt = new Date();
    if (!isActiveAssignment) {
      report.approvalRemark = "not_approved";
    }
    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    notifyReportAssigned(report).catch(console.error);

    const out = report.toObject();
    const hasAssignment =
      out.assignedTeam &&
      out.crewStatus &&
      out.crewStatus !== "unassigned" &&
      out.status !== "rejected";
    out.assignedTeamDisplay = hasAssignment
      ? await resolveTeamDisplayName(out.assignedTeam)
      : "";

    res.json({ report: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listPendingApprovals(req, res) {
  try {
    const filterType = ["approved", "rejected", "pending"].includes(req.query.filter)
      ? req.query.filter
      : "pending";

    const hasUpdatedTask = { "updatedTaskReport.submittedAt": { $ne: null } };

    const query =
      filterType === "approved"
        ? {
            approvalRemark: "approved",
            status: "resolved",
            ...hasUpdatedTask,
          }
        : filterType === "rejected"
          ? {
              status: "rejected",
              ...hasUpdatedTask,
            }
          : {
              crewStatus: "awaiting_approval",
              status: { $nin: ["resolved", "rejected"] },
              ...hasUpdatedTask,
            };

    const reports = await Report.find(query)
      .populate("reportedBy", "name email phone residentId")
      .sort({ updatedAt: -1 });

    const rows = await Promise.all(
      reports.map(async (report) => ({
        _id: report._id,
        reportId: report.reportId,
        title: report.title,
        teamName: report.assignedTeam || "—",
        teamLeader: report.assignedTeam
          ? await getTeamLeaderName(report.assignedTeam)
          : "—",
        remarks:
          report.status === "rejected"
            ? "Rejected"
            : report.approvalRemark === "approved"
              ? "Approved"
              : "Not Approved",
        approvalRemark: report.approvalRemark,
        status: report.status,
        createdAt: report.createdAt,
      }))
    );

    res.json({ reports: rows, filter: filterType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function formatUpdatedTaskDate(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function writeRejectedUpdatedTaskReport(req, res) {
  try {
    const { description } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status !== "rejected") {
      return res.status(400).json({
        message: "Updated task reports can only be written for rejected reports",
      });
    }

    const existing = report.updatedTaskReport || {};
    const isFirstWrite = !existing.submittedAt;

    report.updatedTaskReport = {
      description: description.trim(),
      imageUrl: req.file
        ? getFileUrl(req.file)
        : existing.imageUrl || "",
      updateDate: isFirstWrite ? formatUpdatedTaskDate() : existing.updateDate || "",
      submittedAt: isFirstWrite ? new Date() : existing.submittedAt,
    };

    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateUpdatedTaskReportImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!report.updatedTaskReport?.submittedAt) {
      return res.status(400).json({ message: "No updated task report to modify" });
    }

    report.updatedTaskReport.imageUrl = getFileUrl(req.file);
    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function approveReport(req, res) {
  try {
    const { id } = req.params;
    const { approval } = req.body;

    if (!["approved", "not_approved", "rejected"].includes(approval)) {
      return res.status(400).json({ message: "Invalid approval value" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const previousStatus = report.status;

    if (approval === "approved") {
      report.approvalRemark = "approved";
      report.crewStatus = "approved";
      report.status = "resolved";
      report.resolvedAt = new Date();
    } else if (approval === "rejected") {
      report.approvalRemark = "not_approved";
      report.status = "rejected";
      report.resolvedAt = null;
      report.assignedTeam = "";
      report.teamAssignedAt = null;
      report.crewStatus = "unassigned";
      report.assignedTransportRegistration = "";
      report.assignedTransportLabel = "";
    } else {
      report.approvalRemark = "not_approved";
    }

    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    if (approval === "approved") {
      await updateReportOutcomeCounts(report.reportedBy._id, previousStatus, "resolved");
    } else if (approval === "rejected") {
      await updateReportOutcomeCounts(report.reportedBy._id, previousStatus, "rejected");
    }

    if (approval === "approved") {
      notifyReportApproved(report).catch((err) => {
        console.error("[approveReport] notifyReportApproved error:", err);
      });
    } else if (approval === "rejected") {
      notifyStatusChange(report).catch(console.error);
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
