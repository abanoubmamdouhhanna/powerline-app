import mongoose, { Schema, Types, model } from "mongoose";

const suppliesRequestSchema = new Schema(
  {
    customId: String,
    // Work Station Information
    employeeName: {
      type: String,
      required: true,
    },
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    fuelAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: new Date().toISOString().split("T")[0],
    },

    // Fuel Type Information
    fuelType: {
      type: String,
      required: true,
      enum: ["Green", "Diesel", "Red"],
      trim: true,
    },

    // Supplier Reference (instead of embedded supplier details)
    supplier: {
      type: Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    // Payment Details
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Credit Card"],
    },
    paymentReciptImage: String,

    pricePerLiter: {
      type: Number,
      min: 0,
    },
    totalLiters: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },

    // Request Status and Approval
    status: {
      type: String,
      enum: ["Pending", "Waiting", "Review underway", "Completed"],
      default: "Pending",
    },

    //feedback
    isCarCompleted: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    carImage: String,
    matchingSpecs: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",

    },
    specsImage: String,
    matchingSafety: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",

    },
    safetyImage: String,
    receiptImage: String,
    // Metadata
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware: Soft-delete filter
suppliesRequestSchema.pre(/^find/, function (next) {
  if (!this.getOptions || !this.getOptions()?.skipDeletedCheck) {
    this.where({ isDeleted: false });
  }
  next();
});

// Virtual fields for related data
suppliesRequestSchema.virtual("stationDetails", {
  ref: "Station",
  localField: "station",
  foreignField: "_id",
});

suppliesRequestSchema.virtual("supplierDetails", {
  ref: "Supplier",
  localField: "supplier",
  foreignField: "_id",
});

const suppliesRequestModel =
  mongoose.models.SuppliesRequest ||
  model("SuppliesRequest", suppliesRequestSchema);
export default suppliesRequestModel;
