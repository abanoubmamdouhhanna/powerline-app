import { Router } from "express";
import * as notificationController from "./controller/notification.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { createNotificationSchema, headersSchema, notificationId } from "./controller/notification.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();
//create notification
router.post(
  "/createNotification",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePushNotifications"),
  isValid(createNotificationSchema),
  notificationController.createNotification
);

//get all notifications
router.get(
  "/getAllNotifications",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  notificationController.getAllNotifications
);

//get notification by id
router.get(
  "/getNotificationById/:id",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  isValid(notificationId),
  notificationController.getNotificationById
);

//unread count 
router.get(
  "/unreadCount",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]), 
  notificationController.countUnreadNotifications
);

//delete notification
router.delete(
  "/deleteNotification/:id",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  isValid(notificationId),
  notificationController.deleteNotification
);

export default router;
