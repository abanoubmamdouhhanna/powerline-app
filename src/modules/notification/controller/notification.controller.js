import notificationModel from "../../../../DB/models/Notification.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import { sendNotification } from "../../../../services/firebase.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import isToday from "dayjs/plugin/isToday.js";
import isYesterday from "dayjs/plugin/isYesterday.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(utc);
dayjs.extend(timezone);
function formatNotificationTime(date) {
  const d = dayjs(date);

  if (d.isToday()) {
    return d.format("hh:mm A"); // e.g., 12:45 PM
  } else if (d.isYesterday()) {
    return "Yesterday";
  } else {
    return d.format("YYYY-MM-DD");
  }
}

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

  sendNotification(
    employeeId,
    translatedMessage,
    translatedDescription,
    req.language
  );
  res
    .status(200)
    .json({ message: getTranslation("Notification Created", req.language), data: createNotification });
});

//====================================================================================================================//
//get all notifications
export const getAllNotifications = asyncHandler(async (req, res, next) => {
  const language = req.language || "en";

  const apiFeatures = new ApiFeatures(
    notificationModel.find({ employee: req.user._id }).lean(), // filter by user
    req.query
  )
    .filter()
    .search()
    .select();

  // Force sort by createdAt descending
  apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.sort({ createdAt: -1 });

  const paginationResult = await apiFeatures.paginate();
  const notifications = await apiFeatures.mongooseQuery;

  // Find unread notifications to update
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);

  if (unreadIds.length > 0) {
    await notificationModel.updateMany(
      { _id: { $in: unreadIds }, employee: req.user._id },
      { $set: { isRead: true } }
    );
  }

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
      time: formatNotificationTime(notification.createdAt),
      isRead: true, // since we marked them as read now
    };
  });

  return res.status(200).json({
    status: "success",
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
    time: formatNotificationTime(notification.createdAt),
  };

  return res.status(200).json({
    status: "success",
    result: formattedNotification,
  });
});

//====================================================================================================================//
//unread count
export const countUnreadNotifications = asyncHandler(async (req, res, next) => {
  const count = await notificationModel.countDocuments({
    employee: req.user._id,
    isRead: false,
  });

  return res.status(200).json({
    status: "success",
    count,
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
    message: getTranslation("Notification deleted successfully", req.language),
  });
});
