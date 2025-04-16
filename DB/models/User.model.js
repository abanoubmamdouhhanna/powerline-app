import mongoose, { model, Schema, Types } from "mongoose";

// 🔹 Document Sub-schema
const documentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    files: [
      {
        type: String,
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
  },
  { _id: false }
);

// 🔹 Main User Schema
const userSchema = new Schema(
  {
    // 🔹 Personal Info
    customId:String,
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: 3,
      maxlength: 20,
      trim: true,
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
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
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
    station: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    timeWork: {
      type: String,
      required: true,
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
      enum: ["admin", "user", "assistant"],
      default: "user",
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
      default: "loggedOut",
      enum: ["loggedIn", "loggedOut"],
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
