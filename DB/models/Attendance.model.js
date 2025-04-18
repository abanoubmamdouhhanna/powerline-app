import mongoose, { Schema, Types, model } from "mongoose";

const attendanceSchema = new Schema(
  {
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
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: String,
    },
    checkOut: {
      type: String,
    },
    workingHours: {
      type: String,
      default:"00:00 Hrs"
    },
    status: {
      type: String,
      enum: ["On Time", "Late", "Absent"],
      default: "On Time",
    },
    checkInLocation: {
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
    checkOutLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate workingHours
attendanceSchema.pre("save", function (next) {
  // Handle missing checkIn
  if (!this.checkIn) {
    this.status = "Absent";
    return next();
  }

  const checkInTime = new Date(
    `1970-01-01T${convertTo24Hour(this.checkIn)}:00`
  );

  // Determine shift type from check-in (AM or PM)
  const shiftType = this.checkIn.includes("AM") ? "Night" : "Day";

  // Late if:
  // - Night shift → after 12:00 AM
  // - Day shift → after 12:00 PM
  const shiftDeadline =
    shiftType === "Night"
      ? new Date("1970-01-01T00:00:00")
      : new Date("1970-01-01T12:00:00");

  this.status = checkInTime > shiftDeadline ? "Late" : "On Time";

  // Only calculate working hours if checkOut is provided
  if (this.checkOut) {
    let checkOutTime = new Date(
      `1970-01-01T${convertTo24Hour(this.checkOut)}:00`
    );
    // console.log(checkInTime);

    // If checkOut is earlier than checkIn → assume it’s next day
    if (checkOutTime < checkInTime) {
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    const diffMs = checkOutTime - checkInTime;

    const totalMinutes = Math.floor(diffMs / 1000 / 60);

    if (totalMinutes > 0) {
      const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      const minutes = String(totalMinutes % 60).padStart(2, "0");
      this.workingHours = `${hours}:${minutes} Hrs`;
    } else {
      this.workingHours = "00:00 Hrs";
    }
  }

  next();
});

// Utility: Convert "09:15 AM" → "09:15" (24-hour)
function convertTo24Hour(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "00:00";

  const [time, modifier] = timeStr.split(" ");
  if (!time || !modifier) return "00:00";

  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const attendanceModel =
  mongoose.models.Attendance || model("Attendance", attendanceSchema);

export default attendanceModel;
