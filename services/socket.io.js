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
    const createMessage = await messageModel.create(message);
    const messageData = await messageModel
      .findById(createMessage._id)
      .populate("senderId", "_id email name imageUrl")
      .populate("receiverId", "_id email name imageUrl")
      .lean();

    if (!messageData) return;

    // Emit to sender and receiver using emitToUser
    emitToUser(senderId, "receiveMessage", messageData);
    emitToUser(receiverId, "receiveMessage", messageData);
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

    messageData.groupId = groupId;

    const group = await groupModel
      .findByIdAndUpdate(
        groupId,
        { $push: { messages: createMessage._id } },
        { new: true }
      )
      .populate("members", "_id")
      .populate("admin", "_id")
      .lean();

    if (!group || !group.members) return;

    // Emit to all group members using emitToUser
    [...group.members, group.admin].forEach((member) => {
      emitToUser(member._id.toString(), "receiveGroupMessage", messageData);
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
    const timeDiff = (now - createdAt) / (1000 * 60);

    if (timeDiff > 15) {
      console.log("Update not allowed after 15 minutes.");
      return;
    }

    const updatedMessage = await messageModel
      .findByIdAndUpdate(messageId, { content: newContent }, { new: true })
      .populate("senderId", "_id email name imageUrl")
      .populate("receiverId", "_id email name imageUrl")
      .lean();

    if (!updatedMessage) return;

    const { senderId, receiverId } = updatedMessage;
    emitToUser(senderId._id, "messageUpdated", updatedMessage);
    emitToUser(receiverId._id, "messageUpdated", updatedMessage);
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
    const timeDiff = (now - createdAt) / (1000 * 60);

    if (timeDiff > 15) {
      console.log("Delete not allowed after 15 minutes.");
      return;
    }

    const { senderId, receiverId } = message;
    await messageModel.findByIdAndDelete(messageId);

    emitToUser(senderId, "messageDeleted", { messageId });
    emitToUser(receiverId, "messageDeleted", { messageId });
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

function emitToUser(userId, event, data) {
  const socketIds = userSocketMap.get(userId);
  if (socketIds) {
    for (const socketId of socketIds) {
      io.to(socketId).emit(event, data);
    }
  }
}

export { io, app, server };
