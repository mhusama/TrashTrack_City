import { ResidentMessage } from "../models/ResidentMessage.js";
import {
  notifyAdminsAboutContact,
  notifyResidentAboutContactReply,
} from "../utils/notifications.js";

function formatMessage(doc) {
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(row._id),
    senderUserId: row.senderUser ? String(row.senderUser) : null,
    senderName: row.senderName || "",
    senderEmail: row.senderEmail,
    subject: row.subject || "",
    body: row.body,
    status: row.status,
    adminReply: row.adminReply || "",
    repliedAt: row.repliedAt?.toISOString?.() || null,
    createdAt: row.createdAt?.toISOString?.() || null,
    updatedAt: row.updatedAt?.toISOString?.() || null,
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export async function submitContactMessage(req, res) {
  try {
    const subject = String(req.body?.subject || "").trim();
    const body = String(req.body?.body || "").trim();
    const guestName = String(req.body?.name || "").trim();
    const guestEmail = normalizeEmail(req.body?.email);

    if (!body || body.length < 10) {
      return res.status(400).json({ message: "Please enter a message of at least 10 characters" });
    }

    let senderUser = null;
    let senderName = guestName;
    let senderEmail = guestEmail;

    if (req.user) {
      senderUser = req.user._id;
      senderName = req.user.name || guestName;
      senderEmail = normalizeEmail(req.user.email);
    } else if (!senderEmail) {
      return res.status(400).json({ message: "Email address is required" });
    }

    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const message = await ResidentMessage.create({
      senderUser,
      senderName,
      senderEmail,
      subject,
      body,
    });

    notifyAdminsAboutContact(message).catch(console.error);

    res.status(201).json({ message: formatMessage(message) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listMyContactMessages(req, res) {
  try {
    const docs = await ResidentMessage.find({ senderUser: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ messages: docs.map(formatMessage) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listContactMessagesForAdmin(req, res) {
  try {
    const docs = await ResidentMessage.find()
      .sort({ status: 1, createdAt: -1 })
      .lean();
    res.json({ messages: docs.map(formatMessage) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function replyToContactMessage(req, res) {
  try {
    const reply = String(req.body?.reply || "").trim();
    if (!reply || reply.length < 2) {
      return res.status(400).json({ message: "Enter a response" });
    }

    const doc = await ResidentMessage.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Message not found" });
    }

    doc.adminReply = reply;
    doc.status = "replied";
    doc.repliedAt = new Date();
    doc.repliedBy = req.user._id;
    await doc.save();

    notifyResidentAboutContactReply(doc).catch(console.error);

    res.json({ message: formatMessage(doc) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
