import { ChatMessage } from "../models/ChatMessage.js";
import { getFileUrl } from "../utils/fileUrl.js";

export async function listMessages(req, res) {
  try {
    const messages = await ChatMessage.find()
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    res.json({
      messages: messages.map((m) => ({
        ...m,
        id: m._id,
        likedByMe: m.likes?.some((id) => id.toString() === req.user._id.toString()),
        likeCount: m.likes?.length || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function postMessage(req, res) {
  try {
    const { text, replyToMessageId } = req.body;
    const imageUrl = getFileUrl(req.files?.image?.[0]);
    const voiceUrl = getFileUrl(req.files?.voice?.[0]);

    if (!text?.trim() && !imageUrl && !voiceUrl) {
      return res.status(400).json({ message: "Message, image, or voice is required" });
    }

    let replyToText = "";
    let replyToSenderName = "";
    let resolvedReplyToMessageId = null;
    if (replyToMessageId) {
      const replied = await ChatMessage.findById(replyToMessageId)
        .select("text senderName")
        .lean();
      if (!replied) {
        return res.status(404).json({ message: "Reply target message not found" });
      }
      resolvedReplyToMessageId = replied._id;
      replyToText = replied.text || "";
      replyToSenderName = replied.senderName || "";
    }

    const message = await ChatMessage.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      crewSubRole: req.user.crewSubRole || "",
      teamName: req.user.teamName || "",
      text: text?.trim() || "",
      replyToMessageId: resolvedReplyToMessageId,
      replyToText,
      replyToSenderName,
      imageUrl,
      voiceUrl,
      likes: [],
    });

    res.status(201).json({
      message: {
        ...message.toObject(),
        id: message._id,
        likedByMe: false,
        likeCount: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function toggleLike(req, res) {
  try {
    const message = await ChatMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const userId = req.user._id;
    const idx = message.likes.findIndex((id) => id.equals(userId));
    if (idx >= 0) {
      message.likes.splice(idx, 1);
    } else {
      message.likes.push(userId);
    }
    await message.save();

    res.json({
      message: {
        ...message.toObject(),
        id: message._id,
        likedByMe: message.likes.some((id) => id.equals(userId)),
        likeCount: message.likes.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
