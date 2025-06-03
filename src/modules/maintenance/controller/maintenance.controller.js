import maintenanceModel from "../../../../DB/models/Maintenance.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import {
  deleteFromCloudinary,
  destroyCloudinaryFileFromUrl,
  uploadMultipleImages,
} from "../../../utils/cloudinaryHelpers.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//create maintenance request
export const maintenanceRequest = asyncHandler(async (req, res, next) => {
  const { employeeName, description } = req.body;
  const userId = req.user?._id;

  // Validate required fields
  if (!employeeName || !description) {
    return next(new Error("Missing required fields", { cause: 400 }));
  }

  if (!userId) {
    return next(new Error("Unauthorized: User ID missing", { cause: 401 }));
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const customId = nanoid();

  // Translate fields to multiple languages
  const [translatedEmployeeName, translatedDescription] = await Promise.all([
    translateMultiLang(employeeName),
    translateMultiLang(description),
  ]);

  // Upload images if any
  const maintenanceImagesUploads = req.files?.maintenanceImages?.length
    ? await uploadMultipleImages(
        req.files.maintenanceImages,
        customId,
        "maintenanceImages"
      )
    : [];

  // Create the maintenance request
  const maintenance = await maintenanceModel.create({
    customId,
    employeeName: translatedEmployeeName,
    description: translatedDescription,
    station: user.station,
    maintenanceImages: maintenanceImagesUploads,
  });

  // Respond
  res.status(201).json({
    status: "success",
    message: "Maintenance request created successfully",
    result: maintenance,
  });
});

//====================================================================================================================//
//update maintenance request
export const updateMaintenanceRequest = asyncHandler(async (req, res, next) => {
  const { maintenanceId } = req.params;
  const { employeeName, description } = req.body;

  // Check for required fields
  if (!maintenanceId) {
    return next(new Error("Maintenance ID is required", { cause: 400 }));
  }
  const maintenance = await maintenanceModel.findOne({
    customId: maintenanceId,
  });
  if (!maintenance)
    return next(new Error("Maintenance request not found", { cause: 404 }));

  const translatedEmployeeName = await translateMultiLang(employeeName || "");
  const translatedDescription = await translateMultiLang(description || "");

  let maintenanceImagesUploads;

  // If new images are uploaded, destroy the old ones first
  if (req.files?.maintenanceImages?.length) {
    if (Array.isArray(maintenance.maintenanceImages)) {
      await Promise.all(
        maintenance.maintenanceImages.map(async (imgUrl) => {
          try {
            await destroyCloudinaryFileFromUrl(imgUrl);
          } catch (err) {
            console.warn(`Failed to delete old image: ${imgUrl}`, err);
          }
        })
      );
    }

    maintenanceImagesUploads = await uploadMultipleImages(
      req.files.maintenanceImages,
      maintenance.customId,
      "maintenanceImages"
    );
  }
  const updatePayload = {
    employeeName: translatedEmployeeName,
    description: translatedDescription,
  };

  if (maintenanceImagesUploads) {
    updatePayload.maintenanceImages = maintenanceImagesUploads;
  }

  const updatedMaintenance = await maintenanceModel.findByIdAndUpdate(
    maintenanceId,
    updatePayload,
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Maintenance request updated successfully",
    result: updatedMaintenance,
  });
});

//====================================================================================================================//
// Get all maintenance requests
export const getAllMaintenanceRequests = asyncHandler(
  async (req, res, next) => {
    const maintenanceRequests = await maintenanceModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: "success",
      count: maintenanceRequests.length,
      result: maintenanceRequests,
    });
  }
);

//====================================================================================================================//
// Get maintenance request by customId
export const getMaintenanceRequestById = asyncHandler(
  async (req, res, next) => {
    const { maintenanceId } = req.params;

    if (!maintenanceId) {
      return next(new Error("Maintenance ID is required", { cause: 400 }));
    }

    const maintenanceRequest = await maintenanceModel
      .findOne({ _id: maintenanceId })
      .lean();

    if (!maintenanceRequest) {
      return next(new Error("Maintenance request not found", { cause: 404 }));
    }

    res.status(200).json({
      status: "success",
      result: maintenanceRequest,
    });
  }
);
//====================================================================================================================//
//delete maintenance request
export const deleteMaintenanceRequest = asyncHandler(async (req, res, next) => {
  const { maintenanceId } = req.params;
  if (!maintenanceId)
    return next(new Error("Maintenance ID is required", { cause: 400 }));
  const maintenance = await maintenanceModel.findOne({
    _id: maintenanceId,
  });
  if (!maintenance)
    return next(new Error("Maintenance request not found", { cause: 404 }));
  await deleteFromCloudinary(
    `${process.env.APP_NAME}/maintenanceImages/${maintenance.customId}`
  );
  await maintenance.deleteOne();
  res.status(200).json({
    status: "success",
    message: "Maintenance request deleted successfully",
  });
});

//====================================================================================================================//
//update maintenance request status
export const updateMaintenanceRequestStatus = asyncHandler(
  async (req, res, next) => {
    const { maintenanceId } = req.params;
    if (!maintenanceId)
      return next(new Error("Maintenance ID is required", { cause: 400 }));
    const updatedMaintenance = await maintenanceModel.findByIdAndUpdate(
      maintenanceId,
      { status: "Completed" },
      { new: true }
    );

    if (!updatedMaintenance) {
      return next(new Error("Maintenance request not found", { cause: 404 }));
    }

    res.status(200).json({
      status: "success",
      message: "Maintenance request status updated successfully",
      result: updatedMaintenance,
    });
  }
);
