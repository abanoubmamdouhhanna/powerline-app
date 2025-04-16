import mongoose, { Schema, Types, model } from "mongoose";

const storagesSchema = new Schema(
  {
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    storageName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    remainingNo: {
      type: Number,
      required: true,
      min: 0,
    },
    storageImage: String,
  },
  {
    timestamps: true,
  }
);

const storagesModel =
  mongoose.models.Storages || model("Storages", storagesSchema);
export default storagesModel;
