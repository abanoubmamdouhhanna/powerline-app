import messageModel from "../../../../DB/models/Message.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import groupModel from "../../../../DB/models/Group.model.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";

//search contacts
export const searchContacts = asyncHandler(async (req, res, next) => {
  const { searchTerm } = req.query;
  const targetLanguage = req.headers.language || "en"; // default to English

  if (!searchTerm) {
    return next(new Error("SearchTerm is required", { cause: 400 }));
  }

  const sanitizedSearchTerm = searchTerm
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(sanitizedSearchTerm, "i");

  const contacts = await userModel
    .find({
      _id: { $ne: req.user._id },
      $or: [
        { "name.en": regex },
        { "name.ar": regex },
        { "name.bn": regex },
        { email: regex },
      ],
    })
    .lean();

  // Map the contacts to return only the name in target language and imageUrl
  const formattedContacts = contacts.map((contact) => ({
    _id: contact._id,
    name:
      (contact.name && contact.name[targetLanguage]) || contact.name?.en || "",
    avatar: contact.imageUrl || null,
  }));

  return res.status(200).json({
    status: "success",
    message: getTranslation("Searched contacts", targetLanguage),
    contacts: formattedContacts,
  });
});

//====================================================================================================================//
//get all contacts
export const getAllContacts = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";

  const users = await userModel.find(
    { _id: { $ne: req.user._id } },
    "_id name email imageUrl"
  );

  const getField = (fieldObj) => {
    if (typeof fieldObj === "object") {
      return fieldObj[targetLang] || fieldObj.en || Object.values(fieldObj)[0];
    }
    return fieldObj;
  };

  const contacts = users.map((user) => ({
    _id: user._id,
    name: user.name ? getField(user.name) : user.email,
    avatar: user.imageUrl,
  }));

  res.status(200).json({
    status: "success",
    message: getTranslation("Contacts retrieved successfully", targetLang),
    contacts,
  });
});

//====================================================================================================================//
const getUserDMs = async (userId, targetLang) => {
  const getField = (fieldObj) =>
    typeof fieldObj === "object"
      ? fieldObj[targetLang] || fieldObj.en || Object.values(fieldObj)[0]
      : fieldObj;

  const userDMs = await messageModel.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        isDeleted: false,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$senderId", userId] },
            then: "$receiverId",
            else: "$senderId",
          },
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiverId", userId] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "contactInfo",
      },
    },
    { $unwind: "$contactInfo" },
    {
      $project: {
        type: { $literal: "user" },
        _id: "$contactInfo._id",
        email: "$contactInfo.email",
        name: "$contactInfo.name",
        avatar: "$contactInfo.imageUrl",
        lastMessage: {
          content: "$lastMessage.content",
          messageType: "$lastMessage.messageType",
          fileUrl: "$lastMessage.fileUrl",
          createdAt: "$lastMessage.createdAt",
        },
      },
    },
  ]);

  return userDMs.map((u) => ({
    ...u,
    name: getField(u.name),
  }));
};
//====================================================================================================================//
const getGroupDMs = async (userId, targetLang) => {
  const getField = (fieldObj) =>
    typeof fieldObj === "object"
      ? fieldObj[targetLang] || fieldObj.en || Object.values(fieldObj)[0]
      : fieldObj;

  const groups = await groupModel
    .find({
      isDeleted: false,
      $or: [{ admin: userId }, { members: userId }],
    })
    .populate({
      path: "messages",
      match: { isDeleted: false },
      options: { sort: { createdAt: -1 }, limit: 1 },
    })
    .lean();

  return groups.map((group) => ({
    type: "group",
    _id: group._id,
    name: getField(group.name),
    avatar: null, // You can add image support later
    lastMessage: group.messages?.[0]
      ? {
          content: group.messages[0].content,
          messageType: group.messages[0].messageType,
          fileUrl: group.messages[0].fileUrl,
          createdAt: group.messages[0].createdAt,
        }
      : null,
  }));
};

//====================================================================================================================//
//get dm list unified
export const getDMListUnified = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const targetLang = req.language || "en";

  const [userDMs, groupDMs] = await Promise.all([
    getUserDMs(userId, targetLang),
    getGroupDMs(userId, targetLang),
  ]);

  const combined = [...userDMs, ...groupDMs];

  combined.sort((a, b) => {
    const dateA = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt)
      : new Date(0);
    const dateB = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt)
      : new Date(0);
    return dateB - dateA;
  });

  res.status(200).json({
    status: "success",
    message: getTranslation("DM list retrieved successfully", targetLang),
    data: combined,
  });
});
