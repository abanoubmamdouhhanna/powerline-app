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
    checked: {
      type: Boolean,
      default: false,
    },
    workingHours: {
      type: String,
      default: "00:00 Hrs",
    },
    fullDay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["On Time", "Late", "Absent", "Day Off"],
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
//=============================================================================
attendanceSchema.pre("save", async function (next) {
  const Attendance = this;

  const user = await mongoose
    .model("User")
    .findById(Attendance.user)
    .select("workFor");

  if (!user) return next(new Error("User not found"));

  const dayOfWeek = Attendance.date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const isCompany = user.workFor === "company";
  const isStation = user.workFor === "stations";

  //Handle Day Offs
  if (
    (isCompany && (dayOfWeek === 5 || dayOfWeek === 6)) ||
    (isStation && dayOfWeek === 5)
  ) {
    Attendance.status = "Day Off";
    Attendance.workingHours = "00:00 Hrs";
    Attendance.fullDay = false;
    return next();
  }

  //Continue if it's a working day
  const checkInTime = new Date(
    `1970-01-01T${convertTo24Hour(Attendance.checkIn)}:00`
  );

  if (isCompany) {
    const companyStart = new Date("1970-01-01T09:00:00");
    Attendance.status = checkInTime > companyStart ? "Late" : "On Time";
  } else if (isStation) {
    Attendance.status = "On Time";
  }

  //Calculate working hours and fullDay
  if (Attendance.checkOut) {
    let checkOutTime = new Date(
      `1970-01-01T${convertTo24Hour(Attendance.checkOut)}:00`
    );
    if (checkOutTime < checkInTime) {
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    const totalMinutes = Math.floor((checkOutTime - checkInTime) / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    Attendance.workingHours = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")} Hrs`;

    //Full Day logic
    if (isStation) {
      Attendance.fullDay = totalMinutes >= 720; // 12 hours
    } else if (isCompany) {
      Attendance.fullDay = totalMinutes >= 600; // 10 hours
    }
  }

  next();
});
//=============================================================================

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
