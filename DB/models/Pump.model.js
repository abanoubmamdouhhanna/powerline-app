import mongoose, { model, Schema, Types } from "mongoose";

const pumpSchema = new Schema(
  {
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    pumpName: {
      en: { type: String},
      ar: { type: String },
      bn: { type: String },
    },   
    pistolTypes: [
      {
        type: Types.ObjectId,
        ref: "GasolineType",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

pumpSchema.virtual("pistols", {
  ref: "GasolineType",
  localField: "pistolTypes",
  foreignField: "_id",
});

const pumpModel = mongoose.models.Pump || model("Pump", pumpSchema);
export default pumpModel;
