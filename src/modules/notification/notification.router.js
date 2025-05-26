import { Router } from "express";
import * as notificationController from "./controller/notification.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();
//create notification
router.post(
  "/createNotification",
  auth(["employee"]),
  notificationController.createNotification
);

//get all notifications
router.get(
  "/getAllNotifications",
  auth(["employee"]),
  notificationController.getAllNotifications
);

//get notification by id
router.get(
  "/getNotificationById/:id",
  auth(["employee"]),
  notificationController.getNotificationById
);

//delete notification
router.delete(
  "/deleteNotification/:id",
  auth(["employee"]),
  notificationController.deleteNotification
);

export default router;
