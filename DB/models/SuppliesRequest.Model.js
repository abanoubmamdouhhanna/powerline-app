import mongoose, { Schema, Types, model } from "mongoose";

const suppliesRequestSchema = new Schema(
  {
    // Work Station Information
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

    // Fuel Type Information
    fuelType: {
      type: String,
      required: true,
      enum: ["Green Gasoline", "Diesel", "Red Gasoline"],
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
      required: true,
      enum: ["Bank Transfer", "Cash", "Credit Card", "Other"],
      default: "Bank Transfer",
    },
    paymentReciptImage: String,

    pricePerLiter: {
      type: Number,
      required: true,
      min: 0,
    },
    totalLiters: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },

    // Request Status and Approval
    status: {
      type: String,
      enum: ["Pending", "Waiting", "Review underway", "Rejected", "Completed"],
      default: "Pending",
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    approvalDate: Date,
    notes: String,

    //feedback
    isCarCompleted: {
      type: Boolean,
      default: false,
    },
    matchingSpecs: {
      type: Boolean,
      default: false,
    },
    matchingSafety: {
      type: Boolean,
      default: false,
    },
    feedBackImages: [String],
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

// Middleware: Calculate total cost before saving
suppliesRequestSchema.pre("save", function (next) {
  if (this.payment.price && this.payment.amountOfFuelByLitre) {
    this.payment.totalCost =
      this.payment.price * this.payment.amountOfFuelByLitre;
  }
  next();
});

// Virtual fields for related data
suppliesRequestSchema.virtual("employeeDetails", {
  ref: "User",
  localField: "employee",
  foreignField: "_id",
});

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
