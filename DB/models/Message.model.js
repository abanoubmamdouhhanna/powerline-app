import mongoose, { model, Schema, Types } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Types.ObjectId,
      ref: "User",
    },
    messageType: {
      type: String,
      enum: ["text", "file"],
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text"; //This makes the content field required only if messageType is "text".
      },
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.messageType === "file"; //This makes the content field required only if messageType is "file".
      },
    },
    fileUrlPublicId:String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
messageSchema.pre("find", function () {
  this.where({ isDeleted: false });
});
const messageModel = mongoose.models.Message || model("Message", messageSchema);
export default messageModel;
