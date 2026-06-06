import mongoose from "mongoose";

const teamLocationSchema = new mongoose.Schema(
  {
    teamId: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    areas: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, collection: "teamlocations" }
);

export const TeamLocation =
  mongoose.models.TeamLocation || mongoose.model("TeamLocation", teamLocationSchema);
