import { Report } from "../models/Report.js";
import { Vehicle } from "../models/Vehicle.js";
import { getUserModel } from "../models/User.js";
import { resolveTeamDisplayName } from "../services/teamRegistryService.js";

/** Vehicle is reserved while a report holds it during active crew work (before admin approval). */
const TRANSPORT_HOLD_STATUSES = ["assigned", "disposal_in_progress"];

function ensureCrewUser(req, res) {
  if (req.user.role !== "cleaning_crew") {
    res.status(403).json({ message: "Cleaning crew access required" });
    return false;
  }
  if (!req.user.teamName) {
    res.status(400).json({ message: "Team name is not set on your account" });
    return false;
  }
  return true;
}

function teamReportFilter(teamName) {
  return {
    assignedTeam: teamName,
    crewStatus: { $ne: "unassigned" },
  };
}

export async function listTeamReports(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;

    const reports = await Report.find(teamReportFilter(req.user.teamName))
      .populate("reportedBy", "name email phone residentId")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTeamReport(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;

    const report = await Report.findOne({
      _id: req.params.id,
      ...teamReportFilter(req.user.teamName),
    }).populate("reportedBy", "name email phone residentId");

    if (!report) {
      return res.status(404).json({ message: "Report not found for your team" });
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMyTeam(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;

    const CrewUser = getUserModel("cleaning_crew");
    const filter = { role: "cleaning_crew", teamName: req.user.teamName };

    const [leader, members, teamDisplayLabel] = await Promise.all([
      CrewUser.findOne({ ...filter, crewSubRole: "team_leader" }).select(
        "name email phone profilePicture teamName crewSubRole teamId"
      ),
      CrewUser.find({ ...filter, crewSubRole: "team_member" }).select(
        "name email phone profilePicture teamName crewSubRole teamId"
      ),
      resolveTeamDisplayName(req.user.teamName),
    ]);

    res.json({ leader, members, teamName: req.user.teamName, teamDisplayLabel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function markDisposalInProgress(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;
    if (req.user.crewSubRole !== "team_leader") {
      return res.status(403).json({ message: "Only team leaders can update disposal status" });
    }

    const { active } = req.body;
    const report = await Report.findOne({
      _id: req.params.id,
      assignedTeam: req.user.teamName,
      crewStatus: { $in: ["assigned", "disposal_in_progress"] },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (active) {
      if (!report.assignedTransportRegistration?.trim()) {
        return res.status(400).json({
          message: "Select an assigned transport on Task Reports before marking Disposal in Progress",
        });
      }
      report.crewStatus = "disposal_in_progress";
    } else {
      report.crewStatus = "assigned";
    }

    await report.save();
    await report.populate("reportedBy", "name email phone residentId");
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function submitUpdatedTaskReport(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;
    if (req.user.crewSubRole !== "team_leader") {
      return res.status(403).json({ message: "Only team leaders can submit updated reports" });
    }

    const { description } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      assignedTeam: req.user.teamName,
      crewStatus: "disposal_in_progress",
    });

    if (!report) {
      return res.status(400).json({
        message: "Report must be in Disposal in Progress before submitting an update",
      });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    report.updatedTaskReport = {
      description: description.trim(),
      imageUrl,
      updateDate: today,
      submittedAt: new Date(),
    };
    report.crewStatus = "awaiting_approval";
    report.approvalRemark = "not_approved";
    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function unsubmitUpdatedTaskReport(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;
    if (req.user.crewSubRole !== "team_leader") {
      return res.status(403).json({ message: "Only team leaders can unsubmit updated reports" });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      assignedTeam: req.user.teamName,
      crewStatus: "awaiting_approval",
    });

    if (!report) {
      return res.status(400).json({
        message: "No submitted update awaiting approval for this report",
      });
    }

    if (!report.updatedTaskReport?.submittedAt) {
      return res.status(400).json({ message: "Nothing to unsubmit" });
    }

    report.updatedTaskReport = {
      description: "",
      imageUrl: "",
      updateDate: "",
      submittedAt: null,
    };
    report.crewStatus = "disposal_in_progress";
    report.status = "in_progress";
    if (!report.underReviewAt) {
      report.underReviewAt = new Date();
    }
    report.approvalRemark = "not_approved";
    await report.save();
    await report.populate("reportedBy", "name email phone residentId");

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Fleet list + which units are currently held by any team (assigned / disposal in progress).
 */
export async function listVehiclesWithAvailability(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;
    if (req.user.crewSubRole !== "team_leader") {
      return res.status(403).json({ message: "Only team leaders can view transport availability" });
    }

    const vehicles = await Vehicle.find({}).sort({ no: 1 }).lean();
    const held = await Report.find({
      assignedTransportRegistration: { $nin: [null, ""] },
      crewStatus: { $in: TRANSPORT_HOLD_STATUSES },
    })
      .select("_id assignedTransportRegistration assignedTeam crewStatus")
      .lean();

    const regToHolder = new Map();
    for (const r of held) {
      const reg = (r.assignedTransportRegistration || "").trim();
      if (!reg) continue;
      if (!regToHolder.has(reg)) {
        regToHolder.set(reg, {
          reportId: String(r._id),
          teamName: r.assignedTeam,
          crewStatus: r.crewStatus,
        });
      }
    }

    const rows = vehicles.map((v) => {
      const ex = regToHolder.get(v.registrationNumber.trim());
      return {
        no: v.no,
        vehicleName: v.vehicleName,
        vehicleType: v.vehicleType,
        manufacturer: v.manufacturer,
        registrationNumber: v.registrationNumber,
        exclusiveReportId: ex?.reportId ?? null,
        exclusiveTeamName: ex?.teamName ?? null,
        exclusiveCrewStatus: ex?.crewStatus ?? null,
      };
    });

    res.json({ vehicles: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function setReportTransport(req, res) {
  try {
    if (!ensureCrewUser(req, res)) return;
    if (req.user.crewSubRole !== "team_leader") {
      return res.status(403).json({ message: "Only team leaders can assign transport" });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      ...teamReportFilter(req.user.teamName),
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found for your team" });
    }

    if (report.crewStatus === "disposal_in_progress") {
      return res.status(400).json({
        message: "Transport cannot be changed while Disposal in Progress",
      });
    }

    const { registrationNumber } = req.body;
    const clear = registrationNumber == null || String(registrationNumber).trim() === "";

    if (clear) {
      report.assignedTransportRegistration = "";
      report.assignedTransportLabel = "";
      await report.save();
      await report.populate("reportedBy", "name email phone residentId");
      return res.json({ report });
    }

    const reg = String(registrationNumber).trim();
    const vehicle = await Vehicle.findOne({ registrationNumber: reg });
    if (!vehicle) {
      return res.status(400).json({ message: "Unknown registration number" });
    }

    const conflict = await Report.findOne({
      assignedTransportRegistration: reg,
      crewStatus: { $in: TRANSPORT_HOLD_STATUSES },
      _id: { $ne: report._id },
    }).select("_id assignedTeam");

    if (conflict) {
      return res.status(409).json({
        message: "This vehicle is already assigned to another active task",
      });
    }

    const label = `${vehicle.vehicleName} · ${vehicle.registrationNumber}`;
    report.assignedTransportRegistration = reg;
    report.assignedTransportLabel = label;
    await report.save();
    await report.populate("reportedBy", "name email phone residentId");
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
