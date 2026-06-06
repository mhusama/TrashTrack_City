import mongoose from "mongoose";

const residentMessageSchema = new mongoose.Schema(
  {
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    senderName: { type: String, trim: true, default: "" },
    senderEmail: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, trim: true, default: "" },
    body: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "replied"],
      default: "open",
    },
    adminReply: { type: String, trim: true, default: "" },
    repliedAt: { type: Date, default: null },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const ResidentMessage =
  mongoose.models.ResidentMessage ||
  mongoose.model("ResidentMessage", residentMessageSchema);
