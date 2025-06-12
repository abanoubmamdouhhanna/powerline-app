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
const sendMessage = async (message, callback) => {
  try {
    const { senderId, receiverId } = message;
    const createMessage = await messageModel.create(message);
    const messageData = await messageModel
      .findById(createMessage._id)
      .populate("senderId", "_id email name imageUrl")
      .populate("receiverId", "_id email name imageUrl")
      .lean();

    if (!messageData) {
      callback({ status: "error", error: "Message not created" });
      return;
    }

    // Emit to sender and receiver
    emitToUser(senderId, "receiveMessage", messageData);
    emitToUser(receiverId, "receiveMessage", messageData);
    callback({ status: "sent", messageId: createMessage._id });
  } catch (error) {
    console.error("Error sending message:", error);
    callback({ status: "error", error: error.message });
    emitToUser(message.senderId, "error", {
      message: "Failed to send message",
    });
  }
};

//====================================================================================================================//
const sendGroupMessage = async (message, callback) => {
  try {
    const { groupId, senderId, content, messageType, fileUrl } = message;

    // Validate group existence and fetch members
    const group = await groupModel
      .findById(groupId)
      .populate("members", "_id")
      .populate("admin", "_id")
      .lean();

    if (!group) {
      console.error(`Group not found: ${groupId}`);
      callback && callback({ status: "error", error: "Group not found" });
      return;
    }

    // Validate members and admin
    const members = Array.isArray(group.members) ? group.members : [];
    const admin = group.admin || null;
    const validMembers = [
      ...members.filter((member) => member && member._id),
      ...(admin && admin._id ? [admin] : []),
    ].filter(Boolean); // Remove null/undefined

    if (validMembers.length === 0) {
      console.warn(`No valid members in group ${groupId}`);
      callback &&
        callback({ status: "error", error: "No valid members in group" });
      return;
    }

    // Log group details for debugging
    console.log(
      `Group ${groupId} members:`,
      validMembers.map((m) => m._id.toString())
    );

    // Create message
    const createMessage = await messageModel.create({
      senderId,
      receiverId: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
      groupId, // Store groupId for querying
    });

    const messageData = await messageModel
      .findById(createMessage._id)
      .populate("senderId", "_id email name employeeId imageUrl")
      .lean();

    if (!messageData) {
      console.error(`Message not created for group: ${groupId}`);
      callback && callback({ status: "error", error: "Message not created" });
      return;
    }

    messageData.groupId = groupId;

    // Update group with message
    await groupModel.findByIdAndUpdate(
      groupId,
      { $push: { messages: createMessage._id } },
      { new: true }
    );

    // Emit to valid members
    validMembers.forEach((member) => {
      emitToUser(member._id.toString(), "receiveGroupMessage", messageData);
    });

    callback && callback({ status: "sent", messageId: createMessage._id });
  } catch (error) {
    console.error("Error sending group message:", error);
    callback && callback({ status: "error", error: error.message });
    emitToUser(message.senderId, "error", {
      message: "Failed to send group message",
    });
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
    if (!message) {
      emitToUser(message.senderId, "error", { message: "Message not found" });
      return;
    }

    const createdAt = new Date(message.createdAt);
    const now = Date();
    const timeDiff = (now - createdAt) / (1000 * 60);

    if (timeDiff > 15) {
      console.log("Delete not allowed after 15 minutes.");
      emitToUser(message.senderId, "error", {
        message: "Delete not allowed after 15 minutes",
      });
      return;
    }

    const { senderId, receiverId } = message;
    await messageModel.findByIdAndDelete(messageId);

    emitToUser(senderId, "messageDeleted", { messageId });
    emitToUser(receiverId, "messageDeleted", { messageId });
  } catch (error) {
    console.error("Error deleting message:", error);
    emitToUser(message.senderId, "error", {
      message: "Failed to delete message",
    });
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
  // Handle joining one-on-one chat room
  socket.on("join", ({ userId, receiverId }) => {
    const roomID = [userId, receiverId].sort().join("_");
    socket.join(roomID);
    console.log(`User ${socket.id} joined room: ${roomID}`);
  });

  // Handle joining group chat room
  socket.on("joinGroup", ({ userId, groupId }) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group: ${groupId}`);
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
