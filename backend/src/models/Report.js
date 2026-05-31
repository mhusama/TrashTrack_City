import mongoose from "mongoose";

const CREW_STATUSES = [
  "unassigned",
  "assigned",
  "disposal_in_progress",
  "awaiting_approval",
  "approved",
];

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    title: { type: String, required: true, trim: true },    description: { type: String, trim: true, default: "" },
    category: {
      type: String,
      required: true,
      default: "other",
    },
    subcategory: { type: String, trim: true, default: "" },
    smellRisk: { type: String, default: "" },
    wasteSpreadArea: { type: String, default: "" },
    sensitiveLocations: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "rejected"],
      default: "open",
    },
    crewStatus: {
      type: String,
      enum: CREW_STATUSES,
      default: "unassigned",
    },
    assignedTeam: { type: String, trim: true, default: "" },
    teamAssignedAt: { type: Date, default: null },
    /** Fleet unit reserved for this task (team leader). Released for reuse after awaiting_approval / cleared on reassign. */
    assignedTransportRegistration: { type: String, trim: true, default: "" },
    assignedTransportLabel: { type: String, trim: true, default: "" },
    approvalRemark: {
      type: String,
      enum: ["approved", "not_approved"],
      default: "not_approved",
    },
    updatedTaskReport: {
      description: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      updateDate: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
    },
    area: { type: String, trim: true, default: "Other" },
    underReviewAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, trim: true, default: "" },
      nearbyLandmark: { type: String, trim: true, default: "" },
    },
    photoUrl: { type: String, default: "" },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
