import mongoose from "mongoose";

/** Fleet registry — stored in the main app DB (e.g. `test`) in collection `vehicle`. */
const vehicleSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, min: 1 },
    vehicleName: { type: String, required: true, trim: true },
    vehicleType: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

export const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema, "vehicle");
