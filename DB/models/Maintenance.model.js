import mongoose, { model, Schema, Types } from "mongoose";

const maintenanceSchema = new Schema(
  {
    customId: String,
    employeeName: {
      en: { type: String },
      ar: { type: String },
      bn: { type: String },
    },
    description: {
      en: { type: String },
      ar: { type: String },
      bn: { type: String },
    },
    status: {
      type: String,
      enum: ["Under maintenance", "Completed"],
      default: "Under maintenance",
    },
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    maintenanceImages: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const maintenanceModel =
  mongoose.models.Maintenance || model("Maintenance", maintenanceSchema);
export default maintenanceModel;
