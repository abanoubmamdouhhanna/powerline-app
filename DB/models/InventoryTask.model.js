import mongoose, { Schema, Types, model } from "mongoose";

const inventoryTaskSchema = new Schema(
  {
    customId:String,
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    subTask: { type: String, default:"Station Inventory" },
    pumps: [
      {
        pump: { type: Types.ObjectId, ref: "Pump", required: true },
        pistols: [
          {
            pistol: { type: Types.ObjectId, ref: "GasolineType", required: true },
            counterNumber: { type: Number, required: true, min: 0 },
          }
        ]
      }
    ],
    
    date: {
      type: Date,
      required: true,
      default: () => new Date(), // sets the current date and time
    },
    time: {
      type: String,
      required: true,
      default: () => {
        const now = new Date();
        return now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }); // e.g., "09:15 AM"
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    inventoryImages: [
      {
        type: String, // URL or file path
      },
    ],
  },
  {
    timestamps: true,
  }
);

const inventoryTaskModel =
  mongoose.models.InventoryTask || model("InventoryTask", inventoryTaskSchema);

export default inventoryTaskModel;
