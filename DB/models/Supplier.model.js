import mongoose, { Schema, Types, model } from "mongoose";

const supplierSchema = new Schema(
  {
    customId:String,
    station: [
      {
        type: Types.ObjectId,
        ref: "Station",
      },
    ],
    supplierName: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
      bn: { type: String, required: true },
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
      ar: { type: String, required: true },
      en: { type: String, required: true },
      bn: { type: String, required: true },
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
