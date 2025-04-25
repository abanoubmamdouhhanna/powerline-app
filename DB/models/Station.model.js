import mongoose, { model, Schema, Types } from "mongoose";

// 🔹 Document Sub-schema
const documentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  files: [
    {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      resource_type: {
        type: String,
        required: true,
        enum: ["image", "raw"], // optional but safe
      },
    },
  ],
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
});
// 🔹 Sub-schema: Shop
const shopSchema = new Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    shopImage: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    leaseDoc: {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        resource_type: {
          type: String,
          required: true,
          enum: ["image", "raw"], // optional but safe
        },
    },
    residenceExpiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false }
);

// 🔹 Main Schema: Station
const stationSchema = new Schema(
  {
    customId: String,
    employees: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    stationName: {
      type: String,
      required: true,
      trim: true,
    },
    stationAddress: {
      type: String,
      required: true,
      trim: true,
    },
    noOfPumps: {
      type: Number,
      required: true,
      min: 0,
    },
    noOfPistol: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    noOfGreenPistol: {
      type: Number,
      required: true,
      min: 0,
    },
    noOfRedPistol: {
      type: Number,
      required: true,
      min: 0,
    },
    noOfDieselPistol: {
      type: Number,
      required: true,
      min: 0,
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    stores: {
      type: [shopSchema],
      default: [],
    },

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

// 🔹 Middleware: Soft-delete filter
stationSchema.pre(/^find/, function (next) {
  if (!this.getOptions || !this.getOptions()?.skipDeletedCheck) {
    this.where({ isDeleted: false });
  }
  next();
});

// 🔹 Virtual Fields
stationSchema.virtual("stationEmployees", {
  ref: "User",
  localField: "employees",
  foreignField: "_id",
});

stationSchema.virtual("attendances", {
  ref: "Attendance",
  localField: "_id",
  foreignField: "station",
});

stationSchema.virtual("gasolinePrice", {
  ref: "Gasoline",
  localField: "_id",
  foreignField: "station",
});
stationSchema.virtual("suplierDetails", {
  ref: "Supplier",
  localField: "supplier",
  foreignField: "_id",
});

// 🔹 Model Export
const stationModel = mongoose.models.Station || model("Station", stationSchema);
export default stationModel;
