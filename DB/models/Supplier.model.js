import mongoose, { Schema, Types, model } from "mongoose";

const supplierSchema = new Schema(
  {
    station: [{
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    }],
    supplierName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    supplierImage: {
      type: String,
    },
    supplierWhatsAppLink: {
      type: String,
      required: true,
    },
    supplierAddress: {
      type: String,
      required: true,
    },
    swiftCode: {
      type: String,
      required: true,
    },
    IBAN: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const supplierModel =
  mongoose.models.Supplier || model("Supplier", supplierSchema);
export default supplierModel;
