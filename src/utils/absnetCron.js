import cron from "node-cron";
import userModel from "../../DB/models/User.model.js";
import attendanceModel from "../../DB/models/Attendance.model.js";

// Run daily at 11:59 PM

export const cronApsent = () => {
  cron.schedule("59 23 * * *", async () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const users = await userModel.find({ isActive: true });

    for (const user of users) {
      const alreadyCheckedIn = await attendanceModel.findOne({
        user: user._id,
        date: startOfDay,
      });

      if (!alreadyCheckedIn) {
        await Attendance.create({
          user: user._id,
          date: startOfDay,
          checkIn: null,
          checkOut: null,
          workingHours: "00:00 Hrs",
          status: "Absent",
          location: {
            type: "Point",
            coordinates: [0, 0], // default or unknown location
          },
        });
      }
    }

    console.log("Absent users logged for today.");
  });
  console.log("Cron job for Absent is running...");
};
