import mongoose from "mongoose";

/** Admin-defined teams (stored on main DB). Keys look like `Team 16`. */
const teamRegistrySchema = new mongoose.Schema(
  {
    teamKey: { type: String, required: true, unique: true, trim: true },
    customName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const TeamRegistry =
  mongoose.models.TeamRegistry || mongoose.model("TeamRegistry", teamRegistrySchema);
