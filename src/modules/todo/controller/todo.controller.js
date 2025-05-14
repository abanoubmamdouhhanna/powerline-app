import { nanoid } from "nanoid";
import { uploadToCloudinary } from "../../../utils/cloudinaryHelpers.js"; // adjust import if needed
import { asyncHandler } from "../../../utils/errorHandling.js";
import toDoModel from "../../../../DB/models/ToDo.model.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";

// //create task

export const createTask = asyncHandler(async (req, res, next) => {
  const {
    user,
    taskName,
    startDate,
    deadline,
    taskDetails,
    comment,
    documents: documentsData = [],
  } = req.body;

  // Basic validation
  if (!taskName || !startDate || !deadline) {
    return next(
      new Error("Task name, start date, and deadline are required", {
        cause: 400,
      })
    );
  }

  if (new Date(startDate) > new Date(deadline)) {
    return next(
      new Error("Start date must be before the deadline", { cause: 400 })
    );
  }

  const customId = nanoid();
  const uploadedFiles = req.files || {};

  // Translate fields
  const translatedTaskName = await translateMultiLang(taskName);
  const translatedTaskDetails = taskDetails
    ? await translateMultiLang(taskDetails)
    : undefined;
  const translatedComment = comment
    ? await translateMultiLang(comment)
    : undefined;

  // Process documents
  const processedDocuments = Array.isArray(documentsData)
    ? await Promise.all(
        documentsData.map(async (doc, i) => {
          const { title } = doc;

          if (!title) {
            throw new Error("Each document must have a title");
          }

          const translatedTitle = await translateMultiLang(title);
          const files = uploadedFiles[`documentFiles_${i}`] || [];
          const folder = `${process.env.APP_NAME}/Todo/${customId}/documents/document_${i}`;

          const fileUploads = await Promise.all(
            files.map((file) =>
              uploadToCloudinary(
                file,
                folder,
                `${customId}_document_${i}_${file.originalname}`
              )
            )
          );

          return {
            title: translatedTitle,
            files: fileUploads,
          };
        })
      )
    : [];

  const newTask = await toDoModel.create({
    user,
    taskName: translatedTaskName,
    startDate,
    deadline,
    taskDetails: translatedTaskDetails,
    comment: translatedComment,
    customId,
    createdBy: req.user._id,
    documents: processedDocuments,
  });

  return res.status(201).json({
    status: "success",
    message: "Task created successfully.",
    task: newTask,
  });
});

//====================================================================================================================//
//get tasks
export const getTasks = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const targetLang = req.language || "en";

  const tasksRaw = await toDoModel.find({ user: userId });

  const tasks = await Promise.all(
    tasksRaw.map(async (task) => {
      const translatedTaskName =
        typeof task.taskName === "object"
          ? task.taskName[targetLang] ||
            task.taskName.en ||
            Object.values(task.taskName)[0]
          : task.taskName;

      const translatedTaskDetails =
        typeof task.taskDetails === "object"
          ? task.taskDetails[targetLang] ||
            task.taskDetails.en ||
            Object.values(task.taskDetails)[0]
          : task.taskDetails;

      const translatedComment =
        typeof task.comment === "object"
          ? task.comment[targetLang] ||
            task.comment.en ||
            Object.values(task.comment)[0]
          : task.comment;

      const translatedDocuments = Array.isArray(task.documents)
        ? task.documents.map((doc) => ({
            ...doc.toObject(),
            title:
              typeof doc.title === "object"
                ? doc.title[targetLang] ||
                  doc.title.en ||
                  Object.values(doc.title)[0]
                : doc.title,
          }))
        : [];

      return {
        ...task.toObject(),
        taskName: translatedTaskName,
        taskDetails: translatedTaskDetails,
        comment: translatedComment,
        documents: translatedDocuments,
      };
    })
  );

  return res.status(200).json({
    message: "Success",
    result: tasks,
  });
});

//====================================================================================================================//
//change status
export const changeStatus = asyncHandler(async (req, res, next) => {
  const { status, taskId } = req.body;
  const updateTask = await toDoModel.findOneAndUpdate(
    { _id: taskId, user: req.user._id },
    { status },
    { new: true }
  );
  return res.status(200).json({
    message: "Task status updated successfully",
    result: updateTask,
  });
});
//====================================================================================================================//
//gat all tasks
export const getAllTasks = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";

  // Prepare the mongoose query with user population
  const mongooseQuery = toDoModel
    .find({ createdBy: req.user._id })
    .populate("user", "name email imageUrl"); // Include name and email from user

  // 🔥 Parse date strings to Date objects
  const dateFields = ["startDate", "deadline"];
  for (const field of dateFields) {
    if (req.query[field]) {
      for (const operator in req.query[field]) {
        const value = req.query[field][operator];
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          req.query[field][operator] = new Date(value);
        }
      }
    }
  }

  // Apply filters and pagination
  const apiFeatures = new ApiFeatures(mongooseQuery, req.query).filter();
  const paginationResult = await apiFeatures.paginate();
  const rawTasks = await apiFeatures.mongooseQuery;

  // Translate fields
  const translatedTasks = rawTasks.map((task) => {
    const translatedTaskName =
      typeof task.taskName === "object"
        ? task.taskName[targetLang] ||
          task.taskName.en ||
          Object.values(task.taskName)[0]
        : task.taskName;

    const translatedTaskDetails =
      typeof task.taskDetails === "object"
        ? task.taskDetails[targetLang] ||
          task.taskDetails.en ||
          Object.values(task.taskDetails)[0]
        : task.taskDetails;

    const translatedComment =
      typeof task.comment === "object"
        ? task.comment[targetLang] ||
          task.comment.en ||
          Object.values(task.comment)[0]
        : task.comment;

    const translatedDocuments = Array.isArray(task.documents)
      ? task.documents.map((doc) => ({
          ...doc.toObject(),
          title:
            typeof doc.title === "object"
              ? doc.title[targetLang] ||
                doc.title.en ||
                Object.values(doc.title)[0]
              : doc.title,
        }))
      : [];

    // Translate user name if populated
    const translatedUser = task.user
      ? {
          _id: task.user._id,
          email: task.user.email,
          avatar: task.user.imageUrl,
          name:
            typeof task.user.name === "object"
              ? task.user.name[targetLang] ||
                task.user.name.en ||
                Object.values(task.user.name)[0]
              : task.user.name,
        }
      : null;

    return {
      ...task.toObject(),
      taskName: translatedTaskName,
      taskDetails: translatedTaskDetails,
      comment: translatedComment,
      documents: translatedDocuments,
      user: translatedUser,
    };
  });

  // Send response
  return res.status(200).json({
    message: "Success",
    count: translatedTasks.length,
    pagination: paginationResult,
    result: translatedTasks,
  });
});
