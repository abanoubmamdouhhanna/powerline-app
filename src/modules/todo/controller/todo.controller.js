import { nanoid } from "nanoid";
import { uploadToCloudinary } from "../../../utils/cloudinaryHelpers.js"; // adjust import if needed
import { asyncHandler } from "../../../utils/errorHandling.js";
import toDoModel from "../../../../DB/models/ToDo.model.js";

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
  // Process document uploads in parallel
  const processedDocuments = Array.isArray(documentsData)
    ? await Promise.all(
        documentsData.map(async (doc, i) => {
          const { title } = doc;

          if (!title) {
            throw new Error("Each document must have title");
          }

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
            title,
            files: fileUploads,
          };
        })
      )
    : [];

  const newTask = await toDoModel.create({
    user,
    taskName,
    startDate,
    deadline,
    taskDetails,
    comment,
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
  const tasks = await toDoModel.find({ user: userId });
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
