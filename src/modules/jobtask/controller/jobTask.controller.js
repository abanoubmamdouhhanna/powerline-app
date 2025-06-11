import { nanoid } from "nanoid";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cleaningTaskModel from "../../../../DB/models/CleaningTask.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { uploadMultipleImages } from "../../../utils/cloudinaryHelpers.js";
import inventoryTaskModel from "../../../../DB/models/InventoryTask.model.js";

//cleaning task
export const cleaningJobTask = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { employeeName, subTask } = req.body;
  const location = JSON.parse(req.body.location);
  const customId = nanoid();
  if (!employeeName || !subTask || !location?.coordinates)
    return next(new Error("Missing required fields", { cause: 400 }));

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const cleaningImagesUploads = req.files?.cleaningImages?.length
    ? await uploadMultipleImages(
        req.files.cleaningImages,
        customId,
        "cleaningImages"
      )
    : [];

  const cleaningJob = await cleaningTaskModel.create({
    user: userId,
    station: user.station,
    employeeName,
    subTask,
    location,
    customId,
    cleaningImages: cleaningImagesUploads,
  });
  return res.status(201).json({
    message: getTranslation("Cleaning job added successfully", req.language),
    result: cleaningJob,
  });
});
//====================================================================================================================//
//inventory task
export const inventoryJobTask = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { employeeName, pumps } = req.body; // Expecting pumps as JSON string
  const location = JSON.parse(req.body.location);
  const customId = nanoid();

  if (!employeeName || !location?.coordinates || !pumps) {
    return next(new Error("Missing required fields", { cause: 400 }));
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // Parse pumps JSON safely
  let parsedPumps;
  try {
    parsedPumps = JSON.parse(pumps); // Should be an array of { pump, pistols: [{ pistol, counterNumber }] }
  } catch (err) {
    return next(new Error("Invalid pumps format", { cause: 400 }));
  }

  // Optional validation for each entry (you can expand this)
  for (const pumpEntry of parsedPumps) {
    if (!pumpEntry.pump || !Array.isArray(pumpEntry.pistols)) {
      return next(new Error("Invalid pump entry", { cause: 400 }));
    }
    for (const pistol of pumpEntry.pistols) {
      if (!pistol.pistol || typeof pistol.counterNumber !== "number") {
        return next(new Error("Invalid pistol entry", { cause: 400 }));
      }
    }
  }

  const inventoryImagesUploads = req.files?.inventoryImages?.length
    ? await uploadMultipleImages(
        req.files.inventoryImages,
        customId,
        "InventoryImages"
      )
    : [];

  const inventoryJob = await inventoryTaskModel.create({
    user: userId,
    station: user.station,
    employeeName,
    pumps: parsedPumps,
    location,
    customId,
    inventoryImages: inventoryImagesUploads,
  });

  return res.status(201).json({
    message: getTranslation("Inventory job added successfully", req.language),
    result: inventoryJob,
  });
});
