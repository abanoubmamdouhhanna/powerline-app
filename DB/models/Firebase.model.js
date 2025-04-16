import mongoose, { model, Schema, Types } from "mongoose";

const userTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    fcmToken: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const userTokenModel =
  mongoose.models.UserToken || model("UserToken", userTokenSchema);
export default userTokenModel;
