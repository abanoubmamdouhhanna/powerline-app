import mongoose, { Schema, Types, model } from "mongoose";

const storagesSchema = new Schema(
  {
    customId: {
      type: String,
      required: true,
    },
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    storageName: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    description: {
      ar: { type: String },
      en: { type: String },
      bn: { type: String },
    },
    remainingNo: {
      type: Number,
      required: true,
      min: 0,
    },
    storageImage:  {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const storagesModel =
  mongoose.models.Storages || model("Storages", storagesSchema);
export default storagesModel;
