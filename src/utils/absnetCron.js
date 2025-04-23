import cron from "node-cron";
import userModel from "../../DB/models/User.model.js";
import attendanceModel from "../../DB/models/Attendance.model.js";

// Run daily at 11:59 PM

// export const cronApsent = () => {
//   cron.schedule("59 23 * * *", async () => {
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));

//     const users = await userModel.find({ isActive: true });

//     for (const user of users) {
//       const alreadyCheckedIn = await attendanceModel.findOne({
//         user: user._id,
//         date: startOfDay,
//       });

//       if (!alreadyCheckedIn) {
//         await Attendance.create({
//           user: user._id,
//           date: startOfDay,
//           checkIn: null,
//           checkOut: null,
//           workingHours: "00:00 Hrs",
//           status: "Absent",
//           location: {
//             type: "Point",
//             coordinates: [0, 0], // default or unknown location
//           },
//         });
//       }
//     }

//     console.log("Absent users logged for today.");
//   });
//   console.log("Cron job for Absent is running...");
// };

export const cronApsent = () => {
  cron.schedule("59 23 * * *", async () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const dayOfWeek = startOfDay.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

    const users = await userModel.find({ isActive: true });

    for (const user of users) {
      // Skip if it's user's day off
      const isStation = user.workFor === "stations";
      const isCompany = user.workFor === "company";

      const isDayOff =
        (isStation && dayOfWeek === 5) || // Friday off for stations
        (isCompany && (dayOfWeek === 5 || dayOfWeek === 6)); // Friday & Saturday off for company

      if (isDayOff) continue;

      // Check if already has attendance
      const alreadyCheckedIn = await attendanceModel.findOne({
        user: user._id,
        date: startOfDay,
      });

      if (!alreadyCheckedIn) {
        await attendanceModel.create({
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
