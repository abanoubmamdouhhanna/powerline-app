import Router from "express";
import * as groupController from "./controller/group.controller.js";
import {
  createGroupsSchema,
  getGroupMessagesSchema,
  headersSchema,
} from "./controller/group.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();

//create group
router.post(
  "/createGroup",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageChats"),
  isValid(createGroupsSchema),
  groupController.createGroup
);

//get group
router.get(
  "/getUserGroups",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  groupController.getUserGroups
);

//get group messages
router.get(
  "/getGroupMessages/:groupId",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  isValid(getGroupMessagesSchema),
  groupController.getGroupMessages
);

export default router;
