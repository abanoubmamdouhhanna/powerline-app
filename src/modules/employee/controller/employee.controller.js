import attendanceModel from "../../../../DB/models/Attendance.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//add make checkin and checkout
export const checkIn = asyncHandler(async (req, res,next) => {
  const { checkIn, location } = req.body;
  const userId = req.user._id;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const existing = await attendanceModel.findOne({ user, date: dateOnly });
  if (existing) {
    return next(new Error("Already checked in today.", { cause: 400 }));
  }

  const attendance = await attendanceModel.create({
    user,
    station: user.station,
    date: dateOnly,
    checkIn,
    checkInLocation: location,
  });

  res.status(201).json({ message: "Checked in successfully.", attendance });
});
//====================================================================================================================//
//checkOut
export const checkOut = asyncHandler(async (req, res,next) => {
  const { checkOut, location } = req.body;
  const userId = req.user._id;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const attendance = await attendanceModel.findOne({ user, date: dateOnly });
  if (!attendance) {
    return next(new Error("No check-in found for today.", { cause: 404 }));
  }

  attendance.checkOut = checkOut;
  attendance.checkOutLocation = location;

  await attendance.save(); // triggers workingHours calculation

  res.status(200).json({ message: "Checked out successfully.", attendance });
});
