import { nanoid } from "nanoid";
import maintenanceModel from "../../../../DB/models/Maintenance.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import {
  deleteFromCloudinary,
  destroyCloudinaryFileFromUrl,
  uploadMultipleImages,
} from "../../../utils/cloudinaryHelpers.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import translateAutoDetect from "../../../../languages/api/translateAutoDetect.js";

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
  const maintenance = await maintenanceModel.findById(maintenanceId);
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
    const targetLang = req.language || "en";

    const maintenanceRequests = await maintenanceModel
      .find()
      .populate("station", "stationName")
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = await Promise.all(
      maintenanceRequests.map(async (request) => {
        const employeeName =
          request.employeeName?.[targetLang] ||
          request.employeeName?.en ||
          Object.values(request.employeeName || {})[0] ||
          "";

        const description =
          request.description?.[targetLang] ||
          request.description?.en ||
          Object.values(request.description || {})[0] ||
          "";

        let translatedStatus = request.status || "";
        try {
          const { translatedText } = await translateAutoDetect(
            translatedStatus,
            targetLang
          );
          translatedStatus = translatedText;
        } catch (err) {
          console.error(
            `Translation error for status "${request.status}":`,
            err.message
          );
        }

        let statusColor = "";
        if (request.status === "Under maintenance") {
          statusColor = "warning";
        } else if (request.status === "Completed") {
          statusColor = "green";
        }

        const stationName =
          request.station?.stationName?.[targetLang] ||
          request.station?.stationName?.en ||
          Object.values(request.station?.stationName || {})[0] ||
          "";

        const {
          station, // remove from rest operator
          ...rest
        } = request;

        return {
          ...rest,
          employeeName,
          description,
          status: translatedStatus,
          statusColor,
          stationName,
        };
      })
    );

    res.status(200).json({
      status: "success",
      message: "Maintenance requests retrieved successfully",
      count: formattedRequests.length,
      result: formattedRequests,
    });
  }
);

//====================================================================================================================//
// Get maintenance request
export const getMaintenanceRequestById = asyncHandler(
  async (req, res, next) => {
    const { maintenanceId } = req.params;
    const targetLang = req.language || "en";

    if (!maintenanceId) {
      return next(new Error("Maintenance ID is required", { cause: 400 }));
    }

    // Fetch the maintenance request and populate stationName only
    const maintenanceRequest = await maintenanceModel
      .findOne({ _id: maintenanceId })
      .populate("station", "stationName")
      .lean();

    if (!maintenanceRequest) {
      return next(new Error("Maintenance request not found", { cause: 404 }));
    }

    // Translate employeeName (if it's multilingual object)
    const employeeName =
      maintenanceRequest.employeeName?.[targetLang] ||
      maintenanceRequest.employeeName?.en ||
      (typeof maintenanceRequest.employeeName === "string"
        ? maintenanceRequest.employeeName
        : Object.values(maintenanceRequest.employeeName)[0]) ||
      "";

    // Translate description (if it's multilingual object)
    const description =
      maintenanceRequest.description?.[targetLang] ||
      maintenanceRequest.description?.en ||
      (typeof maintenanceRequest.description === "string"
        ? maintenanceRequest.description
        : Object.values(maintenanceRequest.description)[0]) ||
      "";

    // Translate status text
    let translatedStatus = maintenanceRequest.status || "";
    try {
      const { translatedText } = await translateAutoDetect(
        translatedStatus,
        targetLang
      );
      translatedStatus = translatedText;
    } catch (err) {
      console.error(
        `Translation error for status "${maintenanceRequest.status}":`,
        err.message
      );
    }

    // Set status color
    let color = "";
    if (
      maintenanceRequest.status === "Under maintenance" ||
      maintenanceRequest.status === "تحت الصيانة"
    ) {
      color = "warning";
    } else if (
      maintenanceRequest.status === "Completed" ||
      maintenanceRequest.status === "تم الانتهاء"
    ) {
      color = "green";
    }

    // Translate station name only
    const stationName =
      maintenanceRequest.station?.stationName?.[targetLang] ||
      maintenanceRequest.station?.stationName?.en ||
      Object.values(maintenanceRequest.station?.stationName || {})[0] ||
      "";

    // Remove full station object from result
    const { station, ...rest } = maintenanceRequest;

    // Send response
    res.status(200).json({
      status: "success",
      result: {
        ...rest,
        employeeName,
        description,
        status: translatedStatus,
        color,
        stationName,
      },
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
    const targetLang = req.language || "en";

    if (!maintenanceId)
      return next(new Error("Maintenance ID is required", { cause: 400 }));

    const updatedMaintenance = await maintenanceModel
      .findByIdAndUpdate(maintenanceId, { status: "Completed" }, { new: true })
      .populate("station", "stationName") // fetch station name only
      .lean();

    if (!updatedMaintenance) {
      return next(new Error("Maintenance request not found", { cause: 404 }));
    }

    // Translate status
    let translatedStatus = updatedMaintenance.status;
    try {
      const { translatedText } = await translateAutoDetect(
        updatedMaintenance.status,
        targetLang
      );
      translatedStatus = translatedText;
    } catch (err) {
      console.error("Status translation error:", err.message);
    }

    // Get translated values
    const employeeName =
      updatedMaintenance.employeeName?.[targetLang] ||
      updatedMaintenance.employeeName?.en ||
      Object.values(updatedMaintenance.employeeName)[0] ||
      "";

    const description =
      updatedMaintenance.description?.[targetLang] ||
      updatedMaintenance.description?.en ||
      Object.values(updatedMaintenance.description)[0] ||
      "";

    const stationName =
      updatedMaintenance.station?.stationName?.[targetLang] ||
      updatedMaintenance.station?.stationName?.en ||
      Object.values(updatedMaintenance.station?.stationName || {})[0] ||
      "";

    // Set color based on status
    let color = "";
    if (updatedMaintenance.status === "Under maintenance") {
      color = "warning";
    } else if (updatedMaintenance.status === "Completed") {
      color = "green";
    }

    // Build the response object
    const {
      station, // omit
      employeeName: originalEmployeeName,
      description: originalDescription,
      status,
      ...rest
    } = updatedMaintenance;

    res.status(200).json({
      status: "success",
      message: "Maintenance request deleted successfully",
      result: {
        ...rest,
        employeeName,
        description,
        status: translatedStatus,
        color,
        stationName, // include only translated string
      },
    });
  }
);
