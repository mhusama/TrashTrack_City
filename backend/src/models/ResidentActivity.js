import mongoose from "mongoose";

const residentActivitySchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    residentId: { type: String, trim: true, uppercase: true, default: "" },
    activityType: {
      type: String,
      enum: ["report_posted", "review_posted"],
      required: true,
    },
    activityLabel: { type: String, required: true, trim: true },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
  },
  { timestamps: true }
);

residentActivitySchema.index({ createdAt: -1 });

export const ResidentActivity = mongoose.model("ResidentActivity", residentActivitySchema);
