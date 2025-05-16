import messageModel from "../../../../DB/models/Message.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//search contacts
export const searchContacts = asyncHandler(async (req, res, next) => {
  const { searchTerm } = req.body;
  if (!searchTerm) {
    return next(new Error("SearchTerm is required", { cause: 400 }));
  }
  const sanitilizedSearchTerm = searchTerm.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(sanitilizedSearchTerm, "i");

  const contacts = await userModel
    .find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [{ name: regex }, { email: regex }],
        },
      ],
    })
    .lean();
  return res.status(200).json({
    status: "success",
    message: "Searched contacts.",
    contacts,
  });
});

//====================================================================================================================//
//get contacts
export const getContactsFromDMList = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const contacts = await messageModel.aggregate([
    // 1. Filter messages related to the user
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    // 2. Sort messages by timestamp (latest first)
    { $sort: { timestamp: -1 } },
    // 3. Group by contact ID (last message per contact)
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$senderId", userId] },
            then: "$receiverId",
            else: "$senderId",
          },
        },
        lastMessageTime: { $first: "$timestamp" },
      },
    },
    // 4. Fetch contact details from the "users" collection
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "contactInfo",
      },
    },
    // 5. Unwind contactInfo array
    { $unwind: "$contactInfo" },
    // 6. Add user fields from contactInfo
    {
      $addFields: {
        email: "$contactInfo.email",
        name: "$contactInfo.name",
        avatar: "$contactInfo.imageUrl",
      },
    },
    // 7. Remove unnecessary nested object
    {
      $project: {
        contactInfo: 0, // Removes redundant field
      },
    },
    // 8. Sort by lastMessageTime (latest first)
    { $sort: { lastMessageTime: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    message: "Contacts retrieved successfully.",
    contacts,
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
