import mongoose, { model, Schema, Types } from "mongoose";

const gasolineSchema = new Schema(
  {
    station: { type: Types.ObjectId, ref: "Station", required: true },
    gasolineType: { type: Types.ObjectId, ref: "GasolineType", required: true },
    price: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

const gasolineModel =
  mongoose.models.Gasoline || model("Gasoline", gasolineSchema);
export default gasolineModel;
