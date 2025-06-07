import mongoose, { Schema, model, Types } from "mongoose";

const permissionSchema = new Schema(
  {
    assistant: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    permissionName: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    permissions: {
      manageChats: { type: Boolean, default: false },
      manageEmployees: { type: Boolean, default: false },
      manageAttendace: { type: Boolean, default: false },
      manageJobTasks: { type: Boolean, default: false },
      manageMaintenances: { type: Boolean, default: false },
      managePushNotifications: { type: Boolean, default: false },
      managePermissions: { type: Boolean, default: false },
      manageStations: { type: Boolean, default: false },
      manageGasolinePrices: { type: Boolean, default: false },
      manageViewStats: { type: Boolean, default: false },
      manageStorages: { type: Boolean, default: false },
      manageSuppliers: { type: Boolean, default: false },
      manageTODO: { type: Boolean, default: false },
    },    
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
// 🔹 Middleware Hooks
permissionSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

const permissionModel =
  mongoose.models.Permission || model("Permission", permissionSchema);
export default permissionModel;
