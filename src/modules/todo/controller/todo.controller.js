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
import translateAutoDetect from "../../../../languages/api/translateAutoDetect.js";
import stationModel from "../../../../DB/models/Station.model.js";

//create task
export const createTask = asyncHandler(async (req, res, next) => {
  const language = req.language || 'en';
  const {
    user,
    taskName,
    startDate,
    deadline,
    taskDetails,
    comment,
    documents: documentsData = [],
  } = req.body;

  // Basic validation with translated messages
  if (!taskName || !startDate || !deadline) {
    return next(
      new Error("Task name, start date, and deadline are required",{
        cause: 400,
      })
    );
  }

  if (new Date(startDate) > new Date(deadline)) {
    return next(
      new Error("Start date must be before the deadline",{ 
        cause: 400 
      })
    );
  }

  const customId = nanoid();
  const uploadedFiles = req.files || {};

  // Translate fields
  const [translatedTaskName, translatedTaskDetails, translatedComment] = await Promise.all([
    translateMultiLang(taskName),
    taskDetails ? translateMultiLang(taskDetails) : Promise.resolve(undefined),
    comment ? translateMultiLang(comment) : Promise.resolve(undefined)
  ]);

  // Process documents with error handling
  let processedDocuments = [];
  try {
    processedDocuments = Array.isArray(documentsData)
      ? await Promise.all(
          documentsData.map(async (doc, i) => {
            const { title } = doc;

            if (!title) {
              throw new Error("Each document must have a title");
            }

            const [translatedTitle] = await Promise.all([
              translateMultiLang(title),
            ]);

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
              files: fileUploads.map(file => ({
                secure_url: file.secure_url,
                public_id: file.public_id,
                resource_type: file.resource_type
              })),
            };
          })
        )
      : [];
  } catch (error) {
    return next(new Error("Error processing documents",{ 
      cause: 500 
    }));
  }

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

  // Format the response with language-specific fields
  const formattedTask = {
    _id: newTask._id,
    customId: newTask.customId,
    taskName: newTask.taskName[language] || newTask.taskName.en || Object.values(newTask.taskName)[0],
    startDate: newTask.startDate,
    deadline: newTask.deadline,
    taskDetails: newTask.taskDetails?.[language] || newTask.taskDetails?.en || newTask.taskDetails,
    comment: newTask.comment?.[language] || newTask.comment?.en || newTask.comment,
    status: newTask.status,
    user: newTask.user,
    createdBy: newTask.createdBy,
    documents: newTask.documents.map(doc => ({
      title: doc.title[language] || doc.title.en || Object.values(doc.title)[0],
      files: doc.files,
      _id: doc._id
    })),
    createdAt: newTask.createdAt,
    updatedAt: newTask.updatedAt
  };

  return res.status(201).json({
    status: "success",
    message: "Task created successfully",
    result: formattedTask,
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

      // 🌈 Status color mapping
      const statusColorMap = {
        "Not Started": "red",
        "To Do": "warning",
        "Completed": "green",
      };

      const originalStatus =
        typeof task.status === "string"
          ? task.status
          : task.status?.en || Object.values(task.status || {})[0] || "";

      let translatedStatus = originalStatus;

      if (typeof task.status === "string" && targetLang !== "en") {
        try {
          const { translatedText } = await translateAutoDetect(task.status, targetLang);
          translatedStatus = translatedText;
        } catch (error) {
          console.error("Status translation failed:", error);
        }
      } else if (typeof task.status === "object") {
        translatedStatus =
          task.status[targetLang] ||
          task.status.en ||
          Object.values(task.status)[0] ||
          "";
      }

      // 🕒 createdDate & createdTime
      const createdAt = new Date(task.createdAt);
      const createdDate = createdAt.toISOString().split("T")[0];
      const createdTime = createdAt.toTimeString().slice(0, 5);

      return {
        ...task.toObject(),
        taskName: translatedTaskName,
        taskDetails: translatedTaskDetails,
        comment: translatedComment,
        documents: translatedDocuments,
        status: translatedStatus,
        statusColor: statusColorMap[originalStatus] || "gray",
        createdDate,
        createdTime,
      };
    })
  );

  return res.status(200).json({
    message: "Success",
    result: tasks,
  });
});
//====================================================================================================================//
//get tasks by id
export const getTaskbyId = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const targetLang = req.language || "en";

  const tasksRaw = await toDoModel.find({ user: userId });

  const tasks = await Promise.all(
    tasksRaw.map(async (task) => {
      // 🌍 Translate fields
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

      // 🌈 Define status color map
      const statusColorMap = {
        "Not Started": "red",
        "To Do": "warning",
        "Completed": "green",
      };

      const originalStatus =
        typeof task.status === "string"
          ? task.status
          : task.status?.en || Object.values(task.status || {})[0] || "";

      let translatedStatus = originalStatus;

      if (typeof task.status === "string") {
        if (targetLang !== "en") {
          try {
            const { translatedText } = await translateAutoDetect(task.status, targetLang);
            translatedStatus = translatedText;
          } catch (error) {
            console.error("Failed to translate status:", error);
          }
        }
      } else if (typeof task.status === "object") {
        translatedStatus =
          task.status[targetLang] ||
          task.status.en ||
          Object.values(task.status)[0] ||
          "";
      }

      // 🕒 createdDate & createdTime
      const createdAt = new Date(task.createdAt);
      const createdDate = createdAt.toISOString().split("T")[0];
      const createdTime = createdAt.toTimeString().slice(0, 5);

      return {
        ...task.toObject(),
        taskName: translatedTaskName,
        taskDetails: translatedTaskDetails,
        comment: translatedComment,
        documents: translatedDocuments,
        status: translatedStatus,
        statusColor: statusColorMap[originalStatus] || "gray",
        createdDate,
        createdTime,
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
// export const getAllTasks = asyncHandler(async (req, res, next) => {
//   const targetLang = req.language || "en";

//   // 1. 🔍 Find the user's station
//   const station = await stationModel.findOne({ employees: req.user._id });
//   const translatedStationName = station
//     ? station.stationName?.[targetLang] ||
//       station.stationName?.en ||
//       Object.values(station.stationName || {})[0]
//     : null;

//   // 2. 🔍 Build mongoose query
//   const mongooseQuery = toDoModel
//     .find({ createdBy: req.user._id })
//     .populate("user", "name email imageUrl timeWork permissions");

//   // 3. 🗓 Parse date filters
//   const dateFields = ["startDate", "deadline"];
//   for (const field of dateFields) {
//     if (req.query[field]) {
//       for (const operator in req.query[field]) {
//         const value = req.query[field][operator];
//         if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//           req.query[field][operator] = new Date(value);
//         }
//       }
//     }
//   }

//   // 4. 🧭 Apply filters and pagination
//   const apiFeatures = new ApiFeatures(mongooseQuery, req.query).filter();
//   const paginationResult = await apiFeatures.paginate();
//   const rawTasks = await apiFeatures.mongooseQuery;

//   // 5. 🌍 Translate tasks
//   const translatedTasks = await Promise.all(
//     rawTasks.map(async (task) => {
//       const translatedTaskName =
//         typeof task.taskName === "object"
//           ? task.taskName[targetLang] ||
//             task.taskName.en ||
//             Object.values(task.taskName)[0]
//           : task.taskName;

//       const translatedTaskDetails =
//         typeof task.taskDetails === "object"
//           ? task.taskDetails[targetLang] ||
//             task.taskDetails.en ||
//             Object.values(task.taskDetails)[0]
//           : task.taskDetails;

//       const translatedComment =
//         typeof task.comment === "object"
//           ? task.comment[targetLang] ||
//             task.comment.en ||
//             Object.values(task.comment)[0]
//           : task.comment;

//       const translatedDocuments = Array.isArray(task.documents)
//         ? task.documents.map((doc) => ({
//             ...doc.toObject(),
//             title:
//               typeof doc.title === "object"
//                 ? doc.title[targetLang] ||
//                   doc.title.en ||
//                   Object.values(doc.title)[0]
//                 : doc.title,
//           }))
//         : [];

//       const translatedUser = task.user
//         ? {
//             _id: task.user._id,
//             email: task.user.email,
//             avatar: task.user.imageUrl,
//             name:
//               typeof task.user.name === "object"
//                 ? task.user.name[targetLang] ||
//                   task.user.name.en ||
//                   Object.values(task.user.name)[0]
//                 : task.user.name,
//           }
//         : null;

//       // 🌈 Status color map
//       const statusColorMap = {
//         "Not Started": "red",
//         "To Do": "warning",
//         "Completed": "green",
//       };

//       const originalStatus = task.status;
//       let translatedStatus = originalStatus;

//       if (typeof originalStatus === "string" && targetLang !== "en") {
//         try {
//           const { translatedText } = await translateAutoDetect(originalStatus, targetLang);
//           translatedStatus = translatedText;
//         } catch (error) {
//           console.error("Status translation failed:", error);
//         }
//       }

//       // 🕒 Separate createdAt into createdDate and createdTime
//       const createdAt = new Date(task.createdAt);
//       const createdDate = createdAt.toISOString().split("T")[0];
//       const createdTime = createdAt.toTimeString().slice(0, 5);

//       return {
//         ...task.toObject(),
//         taskName: translatedTaskName,
//         taskDetails: translatedTaskDetails,
//         comment: translatedComment,
//         documents: translatedDocuments,
//         user: translatedUser,
//         stationName: translatedStationName,
//         status: translatedStatus,
//         statusColor: statusColorMap[originalStatus] || "gray",
//         createdDate,
//         createdTime,
//       };
//     })
//   );

//   return res.status(200).json({
//     message: "Success",
//     count: translatedTasks.length,
//     pagination: paginationResult,
//     result: translatedTasks,
//   });
// });
export const getAllTasks = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";

  // 1. 🔍 Find the user's station
  const station = await stationModel.findOne({ employees: req.user._id });
  const translatedStationName = station
    ? station.stationName?.[targetLang] ||
      station.stationName?.en ||
      Object.values(station.stationName || {})[0]
    : null;

  // 2. 🔍 Build mongoose query with nested population
  const mongooseQuery = toDoModel
    .find({ createdBy: req.user._id })
    .populate({
      path: "user",
      select: "name email imageUrl timeWork permissions",
      populate: {
        path: "permissions",
        select: "permissionName",
      },
    });

  // 3. 🗓 Parse date filters
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

  // 4. 🧭 Apply filters and pagination
  const apiFeatures = new ApiFeatures(mongooseQuery, req.query).filter();
  const paginationResult = await apiFeatures.paginate();
  const rawTasks = await apiFeatures.mongooseQuery;

  // 5. 🌍 Translate tasks
  const translatedTasks = await Promise.all(
    rawTasks.map(async (task) => {
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

      const translatedUser = task.user
        ? {
            _id: task.user._id,
            email: task.user.email,
            avatar: task.user.imageUrl,
            timeWork: task.user.timeWork,
            name:
              typeof task.user.name === "object"
                ? task.user.name[targetLang] ||
                  task.user.name.en ||
                  Object.values(task.user.name)[0]
                : task.user.name,
            permissionName:
              task.user.permissions &&
              typeof task.user.permissions.permissionName === "object"
                ? task.user.permissions.permissionName[targetLang] ||
                  task.user.permissions.permissionName.en ||
                  Object.values(task.user.permissions.permissionName)[0]
                : null,
          }
        : null;

      // 🌈 Status color map
      const statusColorMap = {
        "Not Started": "red",
        "To Do": "warning",
        "Completed": "green",
      };

      const originalStatus = task.status;
      let translatedStatus = originalStatus;

      if (typeof originalStatus === "string" && targetLang !== "en") {
        try {
          const { translatedText } = await translateAutoDetect(originalStatus, targetLang);
          translatedStatus = translatedText;
        } catch (error) {
          console.error("Status translation failed:", error);
        }
      }

      // 🕒 Separate createdAt into createdDate and createdTime
      const createdAt = new Date(task.createdAt);
      const createdDate = createdAt.toISOString().split("T")[0];
      const createdTime = createdAt.toTimeString().slice(0, 5);

      return {
        ...task.toObject(),
        taskName: translatedTaskName,
        taskDetails: translatedTaskDetails,
        comment: translatedComment,
        documents: translatedDocuments,
        user: translatedUser,
        stationName: translatedStationName,
        status: translatedStatus,
        statusColor: statusColorMap[originalStatus] || "gray",
        createdDate,
        createdTime,
      };
    })
  );

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
  const targetLang = req.language || "en"; // Get language from request or default to 'en'

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

  // Prepare the response with translated fields
  const translateField = (field) => {
    if (!field) return null;
    return typeof field === "object"
      ? field[targetLang] || field.en || Object.values(field)[0]
      : field;
  };

  const responseTask = {
    _id: task._id,
    user: task.user,
    taskName: translateField(task.taskName),
    startDate: task.startDate,
    deadline: task.deadline,
    taskDetails: translateField(task.taskDetails),
    comment: translateField(task.comment),
    // Include any other fields you want to return
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };

  // If there are documents with titles that need translation
  if (task.documents && Array.isArray(task.documents)) {
    responseTask.documents = task.documents.map((doc) => ({
      ...doc.toObject(),
      title: translateField(doc.title),
    }));
  }

  return res.status(200).json({
    status: "success",
    message: "Task updated successfully.",
    task: responseTask,
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
