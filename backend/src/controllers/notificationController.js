import { Notification } from "../models/Notification.js";

export async function listNotifications(req, res) {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("report", "title status createdAt");

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function unreadCount(req, res) {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
