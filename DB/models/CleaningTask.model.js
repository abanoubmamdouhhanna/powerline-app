import mongoose, { Schema, Types, model } from "mongoose";

const cleaningTaskSchema = new Schema(
  {
    customId: String,
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
    subTask: { type: String, required: true },
    employeeName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(), // sets the current date and time
    },
    time: {
      type: String,
      required: true,
      default: () => {
        const now = new Date();
        return now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }); // e.g., "09:15 AM"
      },
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
    cleaningImages: [
      {
        type: String, // URL or file path
      },
    ],
  },
  {
    timestamps: true,
  }
);

cleaningTaskSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.date = ret.date.toISOString().split("T")[0];
    return ret;
  },
});

const cleaningTaskModel =
  mongoose.models.CleaningTask || model("CleaningTask", cleaningTaskSchema);

export default cleaningTaskModel;
