import mongoose, { model, Schema, Types } from "mongoose";

const gasolineSchema = new Schema(
  {
    gasolineName: {
      type: Schema.Types.Mixed, 
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const gasolineTypeModel = mongoose.models.GasolineType || model("GasolineType", gasolineSchema);
export default gasolineTypeModel;
