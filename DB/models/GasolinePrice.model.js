import mongoose, { model, Schema, Types } from "mongoose";

const gasolineSchema = new Schema(
  {
    station: { type: Types.ObjectId, ref: "Station", required: true },
    greenPrice: { type: Number, required: true, default: 0 },
    redPrice: { type: Number, required: true, default: 0 },
    dieselPrice: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

const gasolineModel =
  mongoose.models.Gasoline || model("Gasoline", gasolineSchema);
export default gasolineModel;
