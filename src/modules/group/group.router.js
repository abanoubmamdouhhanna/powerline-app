import Router from "express";
import * as groupController from "./controller/group.controller.js";
import {
  createGroupsSchema,
  getGroupMessagesSchema,
  headersSchema,
} from "./controller/group.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

//create group
router.post(
  "/createGroup",
  isValid(headersSchema, true),
  auth(["admin", "employee"]),
  isValid(createGroupsSchema),
  groupController.createGroup
);

//get group
router.get(
  "/getUserGroups",
  isValid(headersSchema, true),
  auth(["admin", "employee"]),
  groupController.getUserGroups
);

//get group messages
router.get(
  "/getGroupMessages/:groupId",
  isValid(headersSchema, true),
  auth(["admin", "employee"]),
  isValid(getGroupMessagesSchema),
  groupController.getGroupMessages
);

export default router;
