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
      // Complaints Management
      manageComplaints: { type: Boolean, default: false }, // Track and respond to complaints
      // Account Management
      monitorRegisteredAccounts: { type: Boolean, default: false }, // Oversee and review registered accounts
      editAccountInformation: { type: Boolean, default: false }, // Modify account details
      // Service Requests
      trackServiceRequests: { type: Boolean, default: false }, // Monitor and manage service requests
      // Professions & Trades Management
      manageProfessionsTrades: { type: Boolean, default: false }, // Handle profession and trade-related data
      // Location Management
      manageCitiesRegions: { type: Boolean, default: false }, // Maintain and update city and region information
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
