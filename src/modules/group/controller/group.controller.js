import groupModel from "../../../../DB/models/Group.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//create group
export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, members } = req.body;

  // Ensure the admin exists
  const admin = await userModel.findById(req.user._id);
  if (!admin) {
    return next(new Error("You aren't authorized to take this action!", { cause: 403 }));
  }

  // Validate members (ensure they exist in the database)
  const validMembers = await userModel.find({ _id: { $in: members } }, "_id");
  if (validMembers.length !== members.length) {
    return next(new Error("Some members are not valid users", { cause: 400 }));
  }

  // Create new group
  const newGroup = await groupModel.create({
    name,
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

  const groups = await groupModel
    .find({
      $or: [{ admin: userId }, { members: userId }],
    })
    .select("_id name members admin updatedAt") // Select only required fields
    .populate("admin","_id email name employeeId imageUrl") // Populate admin details
    .populate("members", "_id email name employeeId imageUrl") // Populate members
    .sort({ updatedAt: -1 });

  res.status(200).json({
    status: "success",
    message: "Groups retrieved successfully.",
    groups,
  });
});
//====================================================================================================================//
//get group messages 
export const getGroupMessages = asyncHandler(async (req, res, next) => {
   const {groupId}=req.params
   const group =await groupModel.findById(groupId).populate(
    {
        path:"messages",
        populate:{
            path:"senderId",
            select:"_id email name employeeId imageUrl"
        }
    }
   )
   if (!group) {
    return next(new Error("Group not found", { cause: 404 }));

   }
    return res.status(201).json({
      status: "success",
      message: "Group messages retrieved successfully.",
      messages: group.messages,
    });
  });
  