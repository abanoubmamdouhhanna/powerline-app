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
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
    workingHours: {
      type: String, // formatted like "08:02 Hrs"
    },
    status: {
      type: String,
      enum: ["On Time", "Late", "Absent"],
      default: "On Time",
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
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate workingHours
attendanceSchema.pre("save", function (next) {
  const checkInDate = new Date(
    `1970-01-01T${convertTo24Hour(this.checkIn)}:00`
  );
  const checkOutDate = new Date(
    `1970-01-01T${convertTo24Hour(this.checkOut)}:00`
  );
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();

  if (diffMs > 0) {
    const totalMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    this.workingHours = `${hours}:${minutes} Hrs`;
  } else {
    this.workingHours = "00:00 Hrs";
  }

  next();
});

// Utility: Convert "09:15 AM" → "09:15" (24-hour)
function convertTo24Hour(timeStr) {
  const [time, modifier] = timeStr.split(" ");
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
