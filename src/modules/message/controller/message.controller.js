import messageModel from "../../../../DB/models/Message.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";


// 💬 **Get Messages Between Two Users**
export const getMessages = asyncHandler(async (req, res, next) => {
  const userOne = req.user._id;
  const userTwo = req.params.userId;

  if (!userOne || !userTwo) {
    return next(new Error("Sender and Receiver IDs are required", { cause: 400 }));
  }

  // Fetch messages between the two users
  const messages = await messageModel
    .find({
      $or: [
        { senderId: userOne, receiverId: userTwo },
        { senderId: userTwo, receiverId: userOne },
      ],
    })
    .sort({ createdAt: 1 }) // Fixes timestamps sorting issue
    .select("_id senderId receiverId content messageType fileUrl createdAt"); // Limits fields for better performance

  if (!messages.length) {
    return res.status(200).json({
      status: "success",
      message: "No messages found between these users.",
      result: [],
    });
  }

  res.status(200).json({
    status: "success",
    message: "Messages retrieved successfully.",
    result: messages,
  });
});
//====================================================================================================================//
//upload message file
export const uploadMessageFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("No file uploaded", { cause: 400 }));
  }

  const fileUrl = `/files/${req.file.filename}`;

  return res.status(200).json({
    status: "success",
    message: "File uploaded successfully",
    fileUrl,
  });
});