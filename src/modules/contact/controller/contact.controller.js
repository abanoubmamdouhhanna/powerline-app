import messageModel from "../../../../DB/models/Message.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

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
    message: "Searched contacts.",
    contacts: formattedContacts,
  });
});

//====================================================================================================================//
//get contacts
export const getContactsFromDMList = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const targetLang = req.language || "en";

  const getField = (fieldObj) => {
    if (typeof fieldObj === "object") {
      return fieldObj[targetLang] || fieldObj.en || Object.values(fieldObj)[0];
    }
    return fieldObj;
  };

  const contacts = await messageModel.aggregate([
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
        _id: "$contactInfo._id",
        email: "$contactInfo.email",
        name: "$contactInfo.name", // Keep full object, parse later
        avatar: "$contactInfo.imageUrl",
        lastMessage: {
          content: "$lastMessage.content",
          messageType: "$lastMessage.messageType",
          fileUrl: "$lastMessage.fileUrl",
          createdAt: {
            $dateToString: {
              format: "%H:%M",
              date: "$lastMessage.createdAt",
              timezone: "Asia/Riyadh",
            },
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  // Apply language-specific name selection
  const translatedContacts = contacts.map((contact) => ({
    ...contact,
    name: getField(contact.name),
  }));

  res.status(200).json({
    status: "success",
    message: "Contacts retrieved successfully.",
    contacts: translatedContacts,
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
    name: user.name ? getField(user.name) : user.email,
    avatar: user.imageUrl,
  }));

  res.status(200).json({
    status: "success",
    message: "Contacts retrieved successfully.",
    contacts,
  });
});
