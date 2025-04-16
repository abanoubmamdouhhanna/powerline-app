import mongoose, { model, Schema, Types } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admin: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        type: Types.ObjectId,
        ref: "Message",
        required: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
groupSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

groupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
groupSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});
const groupModel = mongoose.models.Group || model("Group", groupSchema);
export default groupModel;
