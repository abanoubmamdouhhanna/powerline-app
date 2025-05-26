import notificationModel from "../../../../DB/models/Notification.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import { sendNotification } from "../../../../services/firebase.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//create notification
export const createNotification = asyncHandler(async (req, res, next) => {
  const { employeeId, message, description } = req.body;

  const [translatedMessage, translatedDescription] = await Promise.all([
    translateMultiLang(message),
    translateMultiLang(description),
  ]);

  const createNotification = await notificationModel.create({
    employee: employeeId,
    message: translatedMessage,
    description: translatedDescription,
  });

  sendNotification(employeeId, translatedMessage, translatedDescription);
  res
    .status(200)
    .json({ message: "Notification Created", data: createNotification });
});

//====================================================================================================================//
//get all notifications
export const getAllNotifications = asyncHandler(async (req, res, next) => {
  const language = req.language || "en";

  const apiFeatures = new ApiFeatures(
    notificationModel.find().lean(),
    req.query
  )
    .filter()
    .search()
    .sort()
    .select();

  const paginationResult = await apiFeatures.paginate();
  const notifications = await apiFeatures.mongooseQuery;

  const formattedNotifications = notifications.map((notification) => {
    const description =
      notification.description?.[language] ||
      notification.description?.en ||
      (notification.description
        ? Object.values(notification.description)[0]
        : "");

    const message =
      notification.message?.[language] ||
      notification.message?.en ||
      (notification.message ? Object.values(notification.message)[0] : "");

    return {
      _id: notification._id,
      message,
      description,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  });

  return res.status(200).json({
    status: "success",
    message: "Notifications retrieved successfully",
    count: formattedNotifications.length,
    ...paginationResult,
    result: formattedNotifications,
  });
});

//====================================================================================================================//
//get notification by id
export const getNotificationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const language = req.language || "en";

  const notification = await notificationModel.findById(id).lean();

  if (!notification) {
    return next(
      new Error(getTranslation("Notification not found", language), {
        cause: 404,
      })
    );
  }

  // Format notification with language support
  const formattedNotification = {
    _id: notification._id,
    message:
      notification.message?.[language] ||
      notification.message?.en ||
      Object.values(notification.message)[0],
    description:
      notification.description?.[language] ||
      notification.description?.en ||
      Object.values(notification.description)[0],
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };

  return res.status(200).json({
    status: "success",
    message: "Notification retrieved successfully",
    result: formattedNotification,
  });
});
//====================================================================================================================//
//delete notificaition
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const notification = await notificationModel.findByIdAndDelete(id);

  if (!notification) {
    return next(new Error(`No notification found`, { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    message: "Notification deleted successfully",
  });
});
