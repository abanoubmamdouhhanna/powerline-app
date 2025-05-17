import messageModel from "../../../../DB/models/Message.model.js";
import translateAutoDetect from "../../../../languages/api/translateAutoDetect.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { format, isToday, isYesterday } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// 💬 **Get Messages Between Two Users**

export const getMessages = asyncHandler(async (req, res, next) => {
  const userOne = req.user._id;
  const userTwo = req.params.userId;
  const targetLang = req.language || "en"; // Get target language from request

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
    .select("_id senderId receiverId content messageType fileUrl createdAt")
    .lean();

  // Translate messages and group by date
  const groupedMessages = {};
  
  // Process messages in parallel for better performance
  const translationPromises = messages.map(async (msg) => {
    try {
      // Only translate text content (skip if messageType is file/media)
      let translatedContent = msg.content;
      if (msg.messageType === 'text' && msg.content) {
        const { translatedText } = await translateAutoDetect(msg.content, targetLang);
        translatedContent = translatedText;
      }

      const createdAt = new Date(msg.createdAt);
      const label = isToday(createdAt)
      ? "Today"
      : isYesterday(createdAt)
      ? "Yesterday"
      : format(createdAt, "M/d/yyyy");


      return {
        label,
        message: {
          ...msg,
          content: translatedContent,
          time: formatInTimeZone(createdAt, "Asia/Riyadh", "HH:mm")
        }
      };
    } catch (error) {
      console.error(`Failed to translate message ${msg._id}:`, error);
      // Return original message if translation fails
      const createdAt = new Date(msg.createdAt);
      const label = isToday(createdAt)
      ? "Today"
      : isYesterday(createdAt)
      ? "Yesterday"
      : format(createdAt, "M/d/yyyy");

      return {
        label,
        message: {
          ...msg,
          time: formatInTimeZone(createdAt, "Asia/Riyadh", "HH:mm")
        }
      };
    }
  });

  // Wait for all translations to complete
  const translatedMessages = await Promise.all(translationPromises);

  // Group the translated messages
  translatedMessages.forEach(({ label, message }) => {
    if (!groupedMessages[label]) {
      groupedMessages[label] = [];
    }
    groupedMessages[label].push(message);
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
