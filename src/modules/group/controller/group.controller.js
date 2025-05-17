import groupModel from "../../../../DB/models/Group.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
//create group
export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, members } = req.body;

  // Ensure the admin exists
  const admin = await userModel.findById(req.user._id);
  if (!admin) {
    return next(
      new Error("You aren't authorized to take this action!", { cause: 403 })
    );
  }

  // Validate members (ensure they exist in the database)
  const validMembers = await userModel.find({ _id: { $in: members } }, "_id");
  if (validMembers.length !== members.length) {
    return next(new Error("Some members are not valid users", { cause: 400 }));
  }
  const groupName = await translateMultiLang(name);
  // Create new group
  const newGroup = await groupModel.create({
    name: groupName,
    members,
    admin: req.user._id,
  });

  res.status(201).json({
    status: "success",
    message: "Group created successfully.",
    group: newGroup,
  });
});

//====================================================================================================================//
// 📂 **Get User's Groups**
export const getUserGroups = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const targetLanguage = req.headers.language || "en";

  const groups = await groupModel
    .find({
      $or: [{ admin: userId }, { members: userId }],
    })
    .select("_id name members admin updatedAt createdAt") // Added createdAt for your example
    .populate("admin", "_id email name employeeId imageUrl")
    .populate("members", "_id email name employeeId imageUrl")
    .sort({ updatedAt: -1 })
    .lean();

  const formattedGroups = groups.map((group) => ({
    ...group,
    name: (group.name && group.name[targetLanguage]) || group.name?.en || "",
    admin: {
      ...group.admin,
      name:
        (group.admin.name && group.admin.name[targetLanguage]) ||
        group.admin.name?.en ||
        "",
    },
    members: group.members.map((member) => ({
      ...member,
      name:
        (member.name && member.name[targetLanguage]) || member.name?.en || "",
    })),
    memberCount: group.members.length,
    isAdmin: group.admin._id.toString() === userId.toString(),
  }));

  res.status(200).json({
    status: "success",
    message: "Groups retrieved successfully.",
    data: {
      groups: formattedGroups,
    },
  });
});

//====================================================================================================================//
//get group messages
export const getGroupMessages = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const group = await groupModel.findById(groupId).populate({
    path: "messages",
    populate: {
      path: "senderId",
      select: "_id email name employeeId imageUrl",
    },
  });
  if (!group) {
    return next(new Error("Group not found", { cause: 404 }));
  }
  return res.status(201).json({
    status: "success",
    message: "Group messages retrieved successfully.",
    messages: group.messages,
  });
});
