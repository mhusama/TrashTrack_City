import { Report } from "../models/Report.js";
import { sendReportNotification } from "../utils/mailer.js";

export async function listReports(req, res) {
  try {
    const filter = req.user.role === "admin" ? {} : { reportedBy: req.user._id };
    const reports = await Report.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getReport(req, res) {
  try {
    const report = await Report.findById(req.params.id).populate(
      "reportedBy",
      "name email"
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const isOwner = report.reportedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createReport(req, res) {
  try {
    const { title, description, category, lat, lng, address } = req.body;
    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({
        message: "Title and location (lat, lng) are required",
      });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const report = await Report.create({
      title,
      description,
      category,
      location: {
        lat: Number(lat),
        lng: Number(lng),
        address: address || "",
      },
      photoUrl,
      reportedBy: req.user._id,
    });

    await report.populate("reportedBy", "name email");

    if (req.user.email) {
      sendReportNotification({ to: req.user.email, report }).catch(console.error);
    }

    res.status(201).json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("reportedBy", "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ report });
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
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await report.deleteOne();
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
