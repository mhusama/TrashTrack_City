import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    crewSubRole: { type: String, default: "" },
    teamName: { type: String, default: "" },
    text: { type: String, trim: true, default: "" },
    replyToMessageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    replyToText: { type: String, trim: true, default: "" },
    replyToSenderName: { type: String, trim: true, default: "" },
    imageUrl: { type: String, default: "" },
    voiceUrl: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
