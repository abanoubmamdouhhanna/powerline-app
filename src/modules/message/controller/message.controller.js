import messageModel from "../../../../DB/models/Message.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { format, isToday, isYesterday } from "date-fns";

// 💬 **Get Messages Between Two Users**
export const getMessages = asyncHandler(async (req, res, next) => {
  const userOne = req.user._id;
  const userTwo = req.params.userId;

  if (!userOne || !userTwo) {
    return next(
      new Error("Sender and Receiver IDs are required", { cause: 400 })
    );
  }

  // Fetch messages
  const messages = await messageModel
    .find({
      $or: [
        { senderId: userOne, receiverId: userTwo },
        { senderId: userTwo, receiverId: userOne },
      ],
    })
    .sort({ createdAt: 1 })
    .select("_id senderId receiverId content messageType fileUrl createdAt");

  // Group by date
  const groupedMessages = {};

  messages.forEach((msg) => {
    const createdAt = new Date(msg.createdAt);

    let label;
    if (isToday(createdAt)) {
      label = "Today";
    } else if (isYesterday(createdAt)) {
      label = "Yesterday";
    } else {
      label = format(createdAt, "M/d/yyyy"); // e.g., 5/15/2025
    }

    if (!groupedMessages[label]) {
      groupedMessages[label] = [];
    }

    groupedMessages[label].push(msg);
  });

  res.status(200).json({
    status: "success",
    message: "Messages retrieved and grouped by date.",
    result: groupedMessages,
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
