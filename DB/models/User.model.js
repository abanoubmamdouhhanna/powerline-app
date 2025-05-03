import mongoose, { model, Schema, Types } from "mongoose";

// 🔹 Document Sub-schema
const documentSchema = new Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
    bn: { type: String, required: true },
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
// 🔹 Main User Schema
const userSchema = new Schema(
  {
    // 🔹 Personal Info
    customId: String,
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false, // hide by default
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },
    nationality: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    address: {
      ar: { type: String, required: true },
    en: { type: String, required: true },
    bn: { type: String, required: true },
    },
    city: {
      ar: { type: String, required: true },
    en: { type: String, required: true },
    bn: { type: String, required: true },
    },
    imageUrl: {
      type: String,
    },
    nationalId: {
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

    // 🔹 Job Info
    employeeCode: {
      type: String,
      unique: true,
    },
    workFor: {
      type: String,
      enum: ["stations", "company"],
      default: "stations",
    },
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: function () {
        return this.workFor === "stations";
      },
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    timeWork: {
      type: String,
      enum: ["Full-time", "Part-time"],
      default: "Full-time",
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    contractDuration: {
      type: Number,
      required: true,
    },
    residenceExpiryDate: {
      type: Date,
      required: true,
    },

    // 🔹 Documents
    documents: [documentSchema],

    // 🔹 OTP & Security
    otp: String,
    otpexp: Date,
    otpRequestCount: {
      type: Number,
      default: 0,
    },
    otpBlockedUntil: {
      type: Date,
      default: null,
    },
    otpNextAllowedAt: {
      type: Date,
      default: null,
    },

    // 🔹 Permissions & Status
    role: {
      type: String,
      enum: ["admin", "employee", "assistant"],
      default: "employee",
    },
    permissions: {
      type: Types.ObjectId,
      ref: "Permission",
    },
    status: {
      type: String,
      enum: ["Active", "not Active"],
      default: "not Active",
    },
    availability: {
      type: String,
      enum: ["loggedIn", "loggedOut"],
      default: "loggedOut",
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔹 Account Lifecycle
    changeAccountInfo: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    permanentlyDeleted: Date,
    lastRecovered: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.id; // Optional: remove default `id`
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// 🔹 Middleware to exclude soft-deleted users
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions || !this.getOptions()?.skipDeletedCheck) {
    this.where({ isDeleted: false });
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (this.isNew && !this.employeeCode) {
    const lastUser = await mongoose.models.User.findOne().sort({
      createdAt: -1,
    });

    let newCode = "0001";

    if (lastUser?.employeeCode) {
      const lastNumber = parseInt(lastUser.employeeCode, 10);
      const nextNumber = lastNumber + 1;

      newCode = nextNumber
        .toString()
        .padStart(Math.max(4, nextNumber.toString().length), "0");
    }

    this.employeeCode = newCode;
  }

  next();
});

// 🔹 Model Export
const userModel = mongoose.models.User || model("User", userSchema);
export default userModel;
