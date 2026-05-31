import { Report } from "../models/Report.js";
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
  notifyReportApproved,
  notifyReportAssigned,
} from "../utils/notifications.js";

const ACTIVE_ASSIGNMENT_STATUSES = ["assigned", "disposal_in_progress", "awaiting_approval"];

async function getTeamLeaderRecord(teamName) {
  const CrewUser = getUserModel("cleaning_crew");
  return CrewUser.findOne({
    role: "cleaning_crew",
    crewSubRole: "team_leader",
    teamName,
  }).select("name _id teamId");
}

async function getTeamLeaderName(teamName) {
  const leader = await getTeamLeaderRecord(teamName);
  return leader?.name || "—";
}

function crewUserCredentialsSelect() {
  return "name email phone profilePicture teamName crewSubRole role nidNumber nidFrontImage nidBackImage teamId createdAt";
}

function formatCrewUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    crewSubRole: user.crewSubRole || "",
    teamName: user.teamName || "",
    teamId: user.teamId || "",
    profilePicture: user.profilePicture || "",
    nidNumber: user.nidNumber || "",
    nidFrontImage: user.nidFrontImage || "",
    nidBackImage: user.nidBackImage || "",
    createdAt: user.createdAt,
  };
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
        const leader = await getTeamLeaderRecord(teamName);
        const [assignedTasks, disposalInProgress, pendingApproval, teamDisplayLabel] =
          await Promise.all([
            countTeamReports(teamName, { $in: ACTIVE_ASSIGNMENT_STATUSES }),
            countTeamReports(teamName, "disposal_in_progress"),
            countTeamReports(teamName, "awaiting_approval"),
            resolveTeamDisplayName(teamName),
          ]);

        const atCapacity = assignedTasks >= MAX_TEAM_ASSIGNMENTS;

        return {
          teamName,
          teamDisplayLabel,
          teamLeader: leader?.name || "—",
          teamLeaderId: leader?._id?.toString() || null,
          leaderTeamId: leader?.teamId || "",
          assignedTasks,
          disposalInProgress,
          pendingApproval,
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
    const { teamName } = req.params;
    if (!(await isValidTeamName(teamName))) {
      return res.status(400).json({ message: "Invalid team name" });
    }

    const CrewUser = getUserModel("cleaning_crew");
    const [leader, members] = await Promise.all([
      CrewUser.findOne({
        role: "cleaning_crew",
        crewSubRole: "team_leader",
        teamName,
      }).select(crewUserCredentialsSelect()),
      CrewUser.find({
        role: "cleaning_crew",
        crewSubRole: "team_member",
        teamName,
      }).select(crewUserCredentialsSelect()),
    ]);

    res.json({
      leader: formatCrewUser(leader),
      members: members.map(formatCrewUser),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCrewUserCredentials(req, res) {
  try {
    const CrewUser = getUserModel("cleaning_crew");
    const user = await CrewUser.findById(req.params.userId).select(crewUserCredentialsSelect());
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: formatCrewUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAssignmentTable(req, res) {
  try {
    const { reportId } = req.query;
    const keys = await getAllTeamKeysOrdered();

    const teams = await Promise.all(
      keys.map(async (teamName) => {
        const assignedTasks = await countTeamReports(
          teamName,
          { $in: ACTIVE_ASSIGNMENT_STATUSES },
          reportId || null
        );
        const teamLeader = await getTeamLeaderName(teamName);
        const atCapacity = assignedTasks >= MAX_TEAM_ASSIGNMENTS;
        const displayLabel = await resolveTeamDisplayName(teamName);

        return {
          teamName,
          displayLabel,
          teamLeader,
          assignedTasks,
          availability: atCapacity ? "Not available" : "Available",
          canAssign: !atCapacity,
        };
      })
    );

    res.json({ teams });
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

    const previousTeam = report.assignedTeam;
    const isActiveAssignment =
      previousTeam && ACTIVE_ASSIGNMENT_STATUSES.includes(report.crewStatus);

    if (isActiveAssignment && previousTeam === teamName) {
      await report.populate("reportedBy", "name email phone residentId");
      return res.json({ report });
    }

    const assignedTasks = await countTeamReports(
      teamName,
      { $in: ACTIVE_ASSIGNMENT_STATUSES },
      report._id
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

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listPendingApprovals(req, res) {
  try {
    const reports = await Report.find({ crewStatus: "awaiting_approval" })
      .populate("reportedBy", "name email phone residentId")
      .sort({ updatedAt: -1 });

    const rows = await Promise.all(
      reports.map(async (report) => ({
        _id: report._id,
        reportId: report.reportId,
        title: report.title,
        teamName: report.assignedTeam,
        teamLeader: await getTeamLeaderName(report.assignedTeam),
        remarks:
          report.approvalRemark === "approved" ? "Approved" : "Not Approved",
        approvalRemark: report.approvalRemark,
        createdAt: report.createdAt,
      }))
    );

    res.json({ reports: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function approveReport(req, res) {
  try {
    const { id } = req.params;
    const { approval } = req.body;

    if (!["approved", "not_approved"].includes(approval)) {
      return res.status(400).json({ message: "Invalid approval value" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.approvalRemark = approval;

    if (approval === "approved") {
      report.crewStatus = "approved";
      report.status = "resolved";
      report.resolvedAt = new Date();
    }

    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    if (approval === "approved") {
      notifyReportApproved(report).catch(console.error);
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
