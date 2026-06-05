import mongoose from "mongoose";

const feedbackCommentSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, required: true },
    crewSubRole: { type: String, default: "" },
    teamName: { type: String, default: "" },
    text: { type: String, trim: true, default: "", maxlength: 2000 },
    replyToCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedbackComment",
      default: null,
    },
    replyToText: { type: String, trim: true, default: "" },
    replyToSenderName: { type: String, trim: true, default: "" },
    imageUrl: { type: String, default: "" },
    voiceUrl: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

export const FeedbackComment = mongoose.model("FeedbackComment", feedbackCommentSchema);
