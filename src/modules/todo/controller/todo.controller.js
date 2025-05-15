import { nanoid } from "nanoid";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../../utils/cloudinaryHelpers.js"; // adjust import if needed
import { asyncHandler } from "../../../utils/errorHandling.js";
import toDoModel from "../../../../DB/models/ToDo.model.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import cloudinary from "../../../utils/cloudinary.js";

//create task
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
//====================================================================================================================//
//update task
export const updateTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { user, taskName, startDate, deadline, taskDetails, comment } =
    req.body;

  const task = await toDoModel.findById(taskId);
  if (!task) {
    return next(new Error("Task not found", { cause: 404 }));
  }

  // Validate required fields if provided
  if (startDate && deadline && new Date(startDate) > new Date(deadline)) {
    return next(
      new Error("Start date must be before the deadline", { cause: 400 })
    );
  }

  // Prepare updated fields
  if (user) task.user = user;
  if (taskName) task.taskName = await translateMultiLang(taskName);
  if (startDate) task.startDate = startDate;
  if (deadline) task.deadline = deadline;
  if (taskDetails) task.taskDetails = await translateMultiLang(taskDetails);
  if (comment) task.comment = await translateMultiLang(comment);

  await task.save();

  return res.status(200).json({
    status: "success",
    message: "Task updated successfully.",
    task,
  });
});
//====================================================================================================================//
//delete task
export const deleteTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await toDoModel.findById(taskId);
  if (!task) {
    return next(new Error("Task not found", { cause: 404 }));
  }
  if (task.createdBy.toString() !== req.user._id.toString()) {
    return next(
      new Error("You are not authorized to delete this task", { cause: 403 })
    );
  }
  // 1. Delete task documents
  const folderBase = `${process.env.APP_NAME}/Todo/${task.customId}`;
  const fileInfos = task.documents.flatMap((doc) => doc.files);

  // Combine all files to delete into a single array
  const allFilesToDelete = [...fileInfos];
  try {
    // 2. Delete each file from Cloudinary

    await Promise.all(
      allFilesToDelete.map(({ public_id, resource_type }) =>
        cloudinary.uploader.destroy(public_id, { resource_type })
      )
    );
  } catch (error) {
    console.log(error);
    return next(new Error("Failed to delete task", { cause: 500 }));
  }
  try {
    // 3. Delete the Cloudinary folder if it's empty
    await deleteFromCloudinary(folderBase);
  } catch (error) {
    return next(
      new Error(`Error deleting folder from Cloudinary: ${error.message}`, {
        cause: 500,
      })
    );
  }
  try {
    // 4. Delete the station document from the database
    await toDoModel.findByIdAndDelete(taskId);
  } catch (error) {
    return next(
      new Error(`Error deleting station from database: ${error.message}`, {
        cause: 500,
      })
    );
  }
  return res.status(200).json({ message: "Task deleted successfully" });
});
//====================================================================================================================//
//delete task document
export const deleteTaskDocument = asyncHandler(async (req, res, next) => {
  const { taskId, documentId } = req.body;
  const task = await toDoModel.findById(taskId);
  if (!task) {
    return next(new Error("Task not found", { cause: 404 }));
  }
  const documentIndex = task.documents.findIndex(
    (doc) => doc._id.toString() === documentId
  );
  if (documentIndex === -1) {
    return next(new Error("Document not found", { cause: 404 }));
  }
  const [documentToDelete] = task.documents.splice(documentIndex, 1);
  const files = documentToDelete.files;
  if (!files.length) {
    return next(
      new Error("No files to delete in this document", { cause: 404 })
    );
  }
  const firstFilePublicId = files[0].public_id;
  const folderBase = firstFilePublicId.substring(
    0,
    firstFilePublicId.lastIndexOf("/")
  );
  // Delete all files from Cloudinary
  try {
    const deletePromises = files.map((file) =>
      cloudinary.uploader.destroy(file.public_id, {
        resource_type: file.resource_type || "raw",
      })
    );

    const results = await Promise.allSettled(deletePromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`File ${files[index].public_id} deleted successfully.`);
      } else {
        console.error(
          `Error deleting file ${files[index].public_id}:`,
          result.reason
        );
      }
    });

    // Delete folder after all files are handled
    try {
      await deleteFromCloudinary(folderBase);
      console.log(`Folder ${folderBase} deleted successfully.`);
    } catch (folderErr) {
      console.error(`Failed to delete folder ${folderBase}:`, folderErr);
    }
  } catch (err) {
    console.error("Error while deleting files from Cloudinary:", err);
    return next(
      new Error("Error deleting files from Cloudinary", { cause: 500 })
    );
  }
  await task.save();
  return res
    .status(200)
    .json({ message: "Task document deleted successfully" });
});
//====================================================================================================================//
//add task document
export const addTaskDocument = asyncHandler(async (req, res, next) => {
  const { taskId, title, start, end } = req.body;

  if (!title || !start || !end || !req.files) {
    return next(
      new Error("Missing required fields or document files", { cause: 400 })
    );
  }
  const task = await toDoModel.findById(taskId);
  if (!task) {
    return next(new Error("Task not found", { cause: 404 }));
  }
  const documentIndex = task.documents.length;
  const folder = `${process.env.APP_NAME}/Todo/${task.customId}/documents/document_${documentIndex}`;

  const uploadedFiles = await Promise.all(
    Object.values(req.files)
      .flat()
      .map((file) =>
        uploadToCloudinary(
          file,
          folder,
          `${task.customId}_taskDoc_${documentIndex}_${file.originalname}`
        )
      )
  );
  const translatedTitle = await translateMultiLang(title);

  const newDocument = {
    title: translatedTitle,
    start: new Date(start),
    end: new Date(end),
    files: uploadedFiles,
  };

  task.documents.push(newDocument);
  await task.save();

  return res.status(201).json({
    status: "success",
    message: "Task document added successfully.",
    task,
  });
});

