import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "status_change",
        "nearby_report",
        "same_location",
        "team_assigned",
        "report_approved",
        "crew_update",
        "admin_new_report",
        "admin_review_needed",
        "resident_task_completed",
        "resident_contact",
        "admin_contact_reply",
      ],
      required: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
