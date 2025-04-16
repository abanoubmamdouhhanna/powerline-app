import { Server } from "socket.io";
import http from "http";
import express from "express";
import groupModel from "../DB/models/Group.model.js";
import messageModel from "../DB/models/Message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

const userSocketMap = new Map(); // Stores userId => Set of socketIds

//====================================================================================================================//
// Get a user's socket IDs
export function getReceiverSocketIds(userId) {
  return userSocketMap.get(userId) || new Set();
}
//====================================================================================================================//
const sendMessage = async (message) => {
  try {
    const { senderId, receiverId } = message;
    const senderSocketId = userSocketMap.get(senderId);
    const receiverSocketId = userSocketMap.get(receiverId);

    // Save message to DB
    const createMessage = await messageModel.create(message);
    const messageData = await messageModel
      .findById(createMessage._id)
      .populate("senderId", "_id email name employeeId imageUrl")
      .populate("receiverId", "_id email name employeeId imageUrl")
      .lean();

    if (!messageData) return;

    // Emit message to sender and receiver if online
    [senderSocketId, receiverSocketId].forEach((socketId) => {
      if (socketId) io.to(socketId).emit("receiveMessage", messageData);
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

//====================================================================================================================//
const sendGroupMessage = async (message) => {
  try {
    const { groupId, senderId, content, messageType, fileUrl } = message;

    const createMessage = await messageModel.create({
      senderId,
      receiverId: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
    });

    const messageData = await messageModel
      .findById(createMessage._id)
      .populate("senderId", "_id email name employeeId imageUrl")
      .lean();

    if (!messageData) return;

    // Attach group ID to message data
    messageData.groupId = groupId;

    // Update group messages list
    const group = await groupModel
      .findByIdAndUpdate(groupId, { $push: { messages: createMessage._id } }, { new: true })
      .populate("members", "_id")
      .populate("admin", "_id")
      .lean();

    if (!group || !group.members) return;

    // Emit message to all group members
    [...group.members, group.admin].forEach((member) => {
      const memberSocketId = userSocketMap.get(member._id.toString());
      if (memberSocketId) io.to(memberSocketId).emit("receiveGroupMessage", messageData);
    });
  } catch (error) {
    console.error("Error sending group message:", error);
  }
};

//====================================================================================================================//
//Update Message Function (Allowed only within 15 min)
const updateMessage = async ({ messageId, newContent }) => {
 try {
   const message = await messageModel.findById(messageId);
   if (!message) return;

   const createdAt = new Date(message.createdAt);
   const now = new Date();
   const timeDiff = (now - createdAt) / (1000 * 60); // Difference in minutes

   if (timeDiff > 15) {
     console.log("Update not allowed after 15 minutes.");
     return;
   }

   // Update message in DB
   const updatedMessage = await messageModel
     .findByIdAndUpdate(
       messageId,
       { content: newContent },
       { new: true } // Return the updated document
     )
     .populate("senderId", "_id email name")
     .populate("receiverId", "_id email name")
     .lean();

   if (!updatedMessage) return;

   const { senderId, receiverId } = updatedMessage;
   const senderSocketId = userSocketMap.get(senderId._id);
   const receiverSocketId = userSocketMap.get(receiverId._id);

   // Emit updated message to sender and receiver if online
   [senderSocketId, receiverSocketId].forEach((socketId) => {
     if (socketId) io.to(socketId).emit("messageUpdated", updatedMessage);
   });
 } catch (error) {
   console.error("Error updating message:", error);
 }
};
//====================================================================================================================//
//Delete Message Function (Allowed only within 15 min)
const deleteMessage = async (messageId) => {
 try {
   const message = await messageModel.findById(messageId);
   if (!message) return;

   const createdAt = new Date(message.createdAt);
   const now = new Date();
   const timeDiff = (now - createdAt) / (1000 * 60); // Difference in minutes

   if (timeDiff > 15) {
     console.log("Delete not allowed after 15 minutes.");
     return;
   }

   const { senderId, receiverId } = message;
   const senderSocketId = userSocketMap.get(senderId);
   const receiverSocketId = userSocketMap.get(receiverId);

   // Delete message from DB
   await messageModel.findByIdAndDelete(messageId);

   // Emit deleted message ID to sender and receiver if online
   [senderSocketId, receiverSocketId].forEach((socketId) => {
     if (socketId) io.to(socketId).emit("messageDeleted", { messageId });
   });
 } catch (error) {
   console.error("Error deleting message:", error);
 }
};

//====================================================================================================================//
// Socket.IO Connection Handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const userId = socket.handshake.query.userId;
  if (userId) {
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);
    console.log(`Mapped user ${userId} to socket ${socket.id}`);
  }

  // Handle joining rooms
  socket.on("join", (roomID) => {
    socket.join(roomID);
    console.log(`User ${socket.id} joined room: ${roomID}`);
  });

  socket.on("sendMessage", sendMessage);
  socket.on("sendGroupMessage", sendGroupMessage);
  socket.on("updateMessage", updateMessage);
  socket.on("deleteMessage", deleteMessage);

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const [userId, socketIds] of userSocketMap.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        console.log(`Removed socket ${socket.id} for user ${userId}`);
        if (socketIds.size === 0) {
          userSocketMap.delete(userId);
        }
        break;
      }
    }
  });

  // Handle errors
  socket.on("error", (err) => {
    console.error(`Socket.IO Error: ${err.message}`);
  });
});

export { io, app, server };
