import mongoose, { Schema, Types, model } from "mongoose";

const notificationSchema = new Schema(
  {
    employee: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.pre(/^find/, function (next) {
  if (!this.getOptions || !this.getOptions()?.skipDeletedCheck) {
    this.where({ isDeleted: false });
  }
  next();
});

const notificationModel =
  mongoose.models.Notification || model("Notification", notificationSchema);

export default notificationModel;
