import mongoose, { Schema, Types, model } from "mongoose";

//daily job tasks
const jobTaskSchema = new Schema(
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
    taskTitle: {
      type: String, // e.g., "Station Cleaner", "Inventory"
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // "09:15 AM"
      required: true,
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
    images: [{
      type: String, // URL or file path
    }],
  },
  {
    timestamps: true,
  }
);

const jobTaskModel = mongoose.models.JobTask || model("JobTask", jobTaskSchema);

export default jobTaskModel;
