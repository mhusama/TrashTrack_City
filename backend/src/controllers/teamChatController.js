import { TeamChatMessage } from "../models/TeamChatMessage.js";

function formatMessage(message, userId) {
  return {
    ...message,
    id: message._id,
    likedByMe: message.likes?.some((id) => id.toString() === userId.toString()),
    likeCount: message.likes?.length || 0,
  };
}

function userTeamName(req) {
  return req.user.teamName?.trim() || "";
}

export async function listTeamMessages(req, res) {
  try {
    const teamName = userTeamName(req);
    const messages = await TeamChatMessage.find({ teamName })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    res.json({
      messages: messages.map((m) => formatMessage(m, req.user._id)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function postTeamMessage(req, res) {
  try {
    const teamName = userTeamName(req);
    const { text, replyToMessageId } = req.body;
    const imageUrl = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : "";
    const voiceUrl = req.files?.voice?.[0] ? `/uploads/${req.files.voice[0].filename}` : "";

    if (!text?.trim() && !imageUrl && !voiceUrl) {
      return res.status(400).json({ message: "Message, image, or voice is required" });
    }

    let replyToText = "";
    let replyToSenderName = "";
    let resolvedReplyToMessageId = null;
    if (replyToMessageId) {
      const replied = await TeamChatMessage.findOne({
        _id: replyToMessageId,
        teamName,
      })
        .select("text senderName")
        .lean();
      if (!replied) {
        return res.status(404).json({ message: "Reply target message not found" });
      }
      resolvedReplyToMessageId = replied._id;
      replyToText = replied.text || "";
      replyToSenderName = replied.senderName || "";
    }

    const message = await TeamChatMessage.create({
      teamName,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      crewSubRole: req.user.crewSubRole || "",
      text: text?.trim() || "",
      replyToMessageId: resolvedReplyToMessageId,
      replyToText,
      replyToSenderName,
      imageUrl,
      voiceUrl,
      likes: [],
    });

    res.status(201).json({
      message: formatMessage(message.toObject(), req.user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function toggleTeamLike(req, res) {
  try {
    const teamName = userTeamName(req);
    const message = await TeamChatMessage.findOne({
      _id: req.params.id,
      teamName,
    });
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
      message: formatMessage(message.toObject(), userId),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
