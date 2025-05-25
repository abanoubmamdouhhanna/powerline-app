import Router from "express";
import * as messageController from "./controller/message.controller.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  getMessagesSchema,
  headersSchema,
  messageFileSchema,
} from "./controller/message.validation.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";

const router = Router();

//get messages
router.post(
  "/getMessages/:userId",

  auth(["employee"]),
  isValid(getMessagesSchema),
  messageController.getMessages
);

//upload message file
router.post(
  "/messageFile",

  auth(["employee"]),
  fileUpload(2, allowedTypesMap).single("messageFile"),
  isValid(messageFileSchema),
  messageController.uploadMessageFile
);

export default router;
