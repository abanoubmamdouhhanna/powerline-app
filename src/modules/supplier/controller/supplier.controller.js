import { nanoid } from "nanoid";
import supplierModel from "../../../../DB/models/Supplier.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import {
  deleteFromCloudinary,
  destroyCloudinaryFileFromUrl,
  uploadImageCloudinary,
} from "../../../utils/cloudinaryHelpers.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import suppliesRequestModel from "../../../../DB/models/SuppliesRequest.Model.js";
import userModel from "../../../../DB/models/User.model.js";
import stationModel from "../../../../DB/models/Station.model.js";
import translateAutoDetect from "../../../../languages/api/translateAutoDetect.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";

//add supplier
export const addSupplier = asyncHandler(async (req, res, next) => {
  const {
    supplierName,
    phone,
    supplierWhatsAppLink,
    supplierAddress,
    swiftCode,
    IBAN,
  } = req.body;

  if (
    !supplierName ||
    !phone ||
    !supplierWhatsAppLink ||
    !supplierAddress ||
    !swiftCode ||
    !IBAN
  ) {
    return next(new Error("Missing required fields", { cause: 400 }));
  }

  const customId = nanoid();
  const folder = `${process.env.APP_NAME}/Suppliers/${customId}/supplierImage`;

  const isStringName = typeof supplierName === "string";
  const isStringAddress = typeof supplierAddress === "string";

  // Translate name and address in parallel if needed
  const [translatedSupplierName, translatedSupplierAddress] = await Promise.all(
    [
      isStringName ? translateMultiLang(supplierName) : supplierName,
      isStringAddress ? translateMultiLang(supplierAddress) : supplierAddress,
    ]
  );

  // Upload image in parallel (if file exists)
  const imageUploadPromise = req.file
    ? uploadImageCloudinary(req.file, folder, `${customId}_supplierImage`)
    : Promise.resolve(null);

  const uploadResult = await imageUploadPromise;

  const newSupplier = await supplierModel.create({
    customId,
    supplierName: translatedSupplierName,
    phone,
    supplierWhatsAppLink,
    supplierAddress: translatedSupplierAddress,
    swiftCode,
    IBAN,
    supplierImage: uploadResult,
  });

  return res.status(201).json({
    status: "success",
    message: "Supplier created successfully",
    supplier: newSupplier,
  });
});
//====================================================================================================================//
//update supplier
export const updateSupplier = asyncHandler(async (req, res, next) => {
  const { supplierId } = req.params;
  const language = req.language || 'en'; // Default to English if language not specified
  
  const {
    supplierName,
    phone,
    supplierWhatsAppLink,
    supplierAddress,
    swiftCode,
    IBAN,
  } = req.body;

  const supplier = await supplierModel.findById(supplierId);
  if (!supplier) {
    return next(new Error(getTranslation("Supplier not found", language), { cause: 404 }));
  }

  const updates = {};

  // Handle translations if provided as strings
  if (supplierName) {
    updates.supplierName =
      typeof supplierName === "string"
        ? await translateMultiLang(supplierName)
        : supplierName;
  }

  if (supplierAddress) {
    updates.supplierAddress =
      typeof supplierAddress === "string"
        ? await translateMultiLang(supplierAddress)
        : supplierAddress;
  }

  // Direct updates
  if (phone) updates.phone = phone;
  if (supplierWhatsAppLink) updates.supplierWhatsAppLink = supplierWhatsAppLink;
  if (swiftCode) updates.swiftCode = swiftCode;
  if (IBAN) updates.IBAN = IBAN;

  // Handle image upload if file is sent
  const folder = `${process.env.APP_NAME}/Suppliers/${supplier.customId}/supplierImage`;
  const imageUploadPromise = req.file
    ? uploadImageCloudinary(
        req.file,
        folder,
        `${supplier.customId}_supplierImage`
      )
    : Promise.resolve(null);

  const uploadResult = await imageUploadPromise;
  updates.supplierImage = uploadResult || supplier.supplierImage;

  // Apply updates
  const updatedSupplier = await supplierModel.findByIdAndUpdate(
    supplierId,
    updates,
    { new: true }
  );

  // Format the response according to the requested language
  const formattedResponse = {
    _id: updatedSupplier._id,
    customId: updatedSupplier.customId,
    supplierName: updatedSupplier.supplierName?.[language],
    supplierAddress: updatedSupplier.supplierAddress?.[language],
    phone: updatedSupplier.phone,
    supplierImage: updatedSupplier.supplierImage,
    supplierWhatsAppLink: updatedSupplier.supplierWhatsAppLink,
    swiftCode: updatedSupplier.swiftCode,
    IBAN: updatedSupplier.IBAN,
    station: updatedSupplier.station,
    createdAt: updatedSupplier.createdAt,
    updatedAt: updatedSupplier.updatedAt
  };

  return res.status(200).json({
    status: "success",
    message: "Supplier updated successfully",
    result: formattedResponse,
  });
});
//====================================================================================================================//
//get all suppliers
export const getAllSuppliers = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en"; // fallback to 'en' if no language is specified

  const suppliers = await supplierModel.find(
    {},
    "supplierName supplierAddress phone supplierWhatsAppLink swiftCode IBAN supplierImage"
  );

  const translatedSuppliers = await Promise.all(
    suppliers.map(async (supplier) => {
      const translatedSupplierName = supplier.supplierName
        ? supplier.supplierName[targetLang] || supplier.supplierName.en
        : "N/A";
      const translatedSupplierAddress = supplier.supplierAddress
        ? supplier.supplierAddress[targetLang] || supplier.supplierAddress.en
        : "N/A";

      return {
        ...supplier.toObject(),
        supplierName: translatedSupplierName,
        supplierAddress: translatedSupplierAddress,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    count: translatedSuppliers.length,
    result: translatedSuppliers,
  });
});

//====================================================================================================================//
//get supplier
export const getSpSupplier = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";
  const { supplierId } = req.params;

  const supplier = await supplierModel.findById(supplierId);

  if (!supplier) {
    return next(new Error("Supplier not found", { cause: 404 }));
  }

  const translatedSupplierName = supplier.supplierName
    ? supplier.supplierName[targetLang] || supplier.supplierName.en
    : "N/A";

  const translatedSupplierAddress = supplier.supplierAddress
    ? supplier.supplierAddress[targetLang] || supplier.supplierAddress.en
    : "N/A";

  const translatedSupplier = {
    ...supplier.toObject(),
    supplierName: translatedSupplierName,
    supplierAddress: translatedSupplierAddress,
  };

  return res.status(200).json({
    status: "success",
    result: translatedSupplier,
  });
});
//====================================================================================================================//
//delete supplier
export const deleteSupplier = asyncHandler(async (req, res, next) => {
  const { supplierId } = req.params;

  const supplier = await supplierModel.findById(supplierId);
  if (!supplier) {
    return next(new Error("Supplier not found", { cause: 404 }));
  }

  const folder = `${process.env.APP_NAME}/Suppliers/${supplier.customId}`;

  if (supplier.supplierImage) {
    await destroyCloudinaryFileFromUrl(supplier.supplierImage);
    await deleteFromCloudinary(folder);
  }

  await supplierModel.findByIdAndDelete(supplierId);

  // Respond with success
  return res.status(200).json({
    status: "success",
    message: "Supplier deleted successfully",
  });
});
//====================================================================================================================//
//supplier request
export const supplierRequest = asyncHandler(async (req, res, next) => {
  const { employeeName, fuelAmount, fuelType } = req.body;
  const userId = req.user?._id;

  // Find the user making the request
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  if (!user.station) {
    return next(
      new Error("User is not assigned to any station", { cause: 400 })
    );
  }

  // Fetch the associated station
  const station = await stationModel.findById(user.station);
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  if (!station.supplier) {
    return next(
      new Error("No supplier associated with this station", { cause: 400 })
    );
  }

  // Create the supplier request
  const newSupplierRequest = await suppliesRequestModel.create({
    employeeName,
    fuelAmount,
    fuelType,
    station: user.station,
    supplier: station.supplier,
  });

  return res.status(201).json({
    status: "success",
    message: "Supplier request created successfully",
    result: newSupplierRequest,
  });
});
//====================================================================================================================//
//get all supplier requests
export const getALLSupplierReq = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";

  const supplierRequests = await suppliesRequestModel
    .find(
      {},
      "supplier station fuelAmount fuelType status carImage receiptImage safetyImage specsImage isCarCompleted matchingSpecs matchingSafety"
    )
    .populate("stationDetails", "stationName")
    .populate(
      "supplierDetails",
      "supplierName phone supplierWhatsAppLink supplierAddress swiftCode IBAN supplierImage"
    )
    .lean({ virtuals: true });

  // Extract unique values for translation
  const uniqueFuelTypes = [
    ...new Set(supplierRequests.map((req) => req.fuelType)),
  ];
  const uniqueStatuses = [
    ...new Set(supplierRequests.map((req) => req.status)),
  ];
  const uniqueSpecsMatches = [
    ...new Set(supplierRequests.map((req) => req.matchingSpecs)),
  ];
  const uniqueSafetyMatches = [
    ...new Set(supplierRequests.map((req) => req.matchingSafety)),
  ];
  const uniqueCarCompleted = [
    ...new Set(supplierRequests.map((req) => req.isCarCompleted)),
  ];

  const translatedFuelTypes = {};
  const translatedStatuses = {};
  const translatedSpecsMatches = {};
  const translatedSafetyMatches = {};
  const translatedCarCompleted = {};

  // Helper function to batch translate a set of values
  const translateSet = async (values, target, outputMap) => {
    await Promise.all(
      values.map(async (val) => {
        const { translatedText } = await translateAutoDetect(
          val?.toString(),
          target
        );
        outputMap[val] = translatedText;
      })
    );
  };

  await translateSet(uniqueFuelTypes, targetLang, translatedFuelTypes);
  await translateSet(uniqueStatuses, targetLang, translatedStatuses);
  await translateSet(uniqueSpecsMatches, targetLang, translatedSpecsMatches);
  await translateSet(uniqueSafetyMatches, targetLang, translatedSafetyMatches);
  await translateSet(uniqueCarCompleted, targetLang, translatedCarCompleted);

  // Format final result
  const formattedRequests = supplierRequests.map((req) => {
    const stationName =
      req.stationDetails?.[0]?.stationName?.[targetLang] ||
      req.stationDetails?.[0]?.stationName?.en;

    const supplierData = req.supplierDetails?.[0];

    const supplierName =
      supplierData?.supplierName?.[targetLang] ||
      supplierData?.supplierName?.en;
    const supplierAddress =
      supplierData?.supplierAddress?.[targetLang] ||
      supplierData?.supplierAddress?.en;

    return {
      _id: req._id,
      station: req.station,
      supplier: req.supplier,
      fuelAmount: req.fuelAmount,
      fuelType: translatedFuelTypes[req.fuelType] || req.fuelType,
      status: translatedStatuses[req.status] || req.status,
      stationName,
      supplierName,
      supplierImage: supplierData.supplierImage,
      phone: supplierData?.phone,
      supplierWhatsAppLink: supplierData?.supplierWhatsAppLink,
      supplierAddress,
      swiftCode: supplierData?.swiftCode,
      IBAN: supplierData?.IBAN,
      carImage: req.carImage,
      receiptImage: req.receiptImage,
      safetyImage: req.safetyImage,
      specsImage: req.specsImage,
      matchingSpecs:
        translatedSpecsMatches[req.matchingSpecs] || req.matchingSpecs,
      matchingSafety:
        translatedSafetyMatches[req.matchingSafety] || req.matchingSafety,
      isCarCompleted:
        translatedCarCompleted[req.isCarCompleted] || req.isCarCompleted,
    };
  });

  return res.status(200).json({
    status: "success",
    result: formattedRequests,
  });
});
//====================================================================================================================//
//get sp supplier request
export const getSpReq = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";
  const { reqId } = req.params;

  // Use findById instead of find for single document retrieval
  const supplierRequest = await suppliesRequestModel
    .findById(
      reqId,
      "supplier station fuelAmount fuelType status carImage receiptImage safetyImage specsImage isCarCompleted matchingSpecs matchingSafety"
    )
    .populate("stationDetails", "stationName")
    .populate(
      "supplierDetails",
      "supplierName phone supplierWhatsAppLink supplierAddress swiftCode IBAN supplierImage"
    )
    .lean({ virtuals: true });

  // Check if document exists
  if (!supplierRequest) {
    return res.status(404).json({
      status: "fail",
      message: "Supplier request not found",
    });
  }

  // For a single document, we don't need Sets to extract unique values
  // Just translate the individual fields directly
  const translatedValues = {
    fuelType: await translateAutoDetect(
      supplierRequest.fuelType?.toString(),
      targetLang
    ),
    status: await translateAutoDetect(
      supplierRequest.status?.toString(),
      targetLang
    ),
    matchingSpecs: await translateAutoDetect(
      supplierRequest.matchingSpecs?.toString(),
      targetLang
    ),
    matchingSafety: await translateAutoDetect(
      supplierRequest.matchingSafety?.toString(),
      targetLang
    ),
    isCarCompleted: await translateAutoDetect(
      supplierRequest.isCarCompleted?.toString(),
      targetLang
    ),
  };

  // Get station and supplier details
  const stationName =
    supplierRequest.stationDetails?.[0]?.stationName?.[targetLang] ||
    supplierRequest.stationDetails?.[0]?.stationName?.en;

  const supplierData = supplierRequest.supplierDetails?.[0];

  const supplierName =
    supplierData?.supplierName?.[targetLang] || supplierData?.supplierName?.en;
  const supplierAddress =
    supplierData?.supplierAddress?.[targetLang] ||
    supplierData?.supplierAddress?.en;

  // Format the result for a single document
  const formattedRequest = {
    _id: supplierRequest._id,
    station: supplierRequest.station,
    supplier: supplierRequest.supplier,
    fuelAmount: supplierRequest.fuelAmount,
    fuelType:
      translatedValues.fuelType?.translatedText || supplierRequest.fuelType,
    status: translatedValues.status?.translatedText || supplierRequest.status,
    stationName,
    supplierName,
    supplierImage: supplierData?.supplierImage,
    phone: supplierData?.phone,
    supplierWhatsAppLink: supplierData?.supplierWhatsAppLink,
    supplierAddress,
    swiftCode: supplierData?.swiftCode,
    IBAN: supplierData?.IBAN,
    carImage: supplierRequest.carImage,
    receiptImage: supplierRequest.receiptImage,
    safetyImage: supplierRequest.safetyImage,
    specsImage: supplierRequest.specsImage,
    matchingSpecs:
      translatedValues.matchingSpecs?.translatedText ||
      supplierRequest.matchingSpecs,
    matchingSafety:
      translatedValues.matchingSafety?.translatedText ||
      supplierRequest.matchingSafety,
    isCarCompleted:
      translatedValues.isCarCompleted?.translatedText ||
      supplierRequest.isCarCompleted,
  };

  return res.status(200).json({
    status: "success",
    result: formattedRequest,
  });
});
//====================================================================================================================//
//send to supplier
export const sendToSupplier = asyncHandler(async (req, res, next) => {
  const { reqId, stationName, fuelType, fuelAmount, supplierWhatsAppLink } =
    req.body;
  const targetLang = req.language || "en";

  // Static labels to translate
  const labels = [
    "New Fuel Request 🚛:",
    "Station",
    "Fuel Type",
    "Fuel Amount",
    "Liters",
  ];

  // Translate all labels in parallel
  const translations = await Promise.all(
    labels.map((label) => translateAutoDetect(label, targetLang))
  );

  // Destructure translated values
  const [
    translatedTitle,
    translatedStation,
    translatedFuelType,
    translatedFuelAmount,
    translatedLiters,
  ] = translations.map((t) => t.translatedText);

  // Construct final translated message
  const message = `${translatedTitle}
- ${translatedStation}: ${stationName}
- ${translatedFuelType}: ${fuelType}
- ${translatedFuelAmount}: ${fuelAmount} ${translatedLiters}`;

  const encodedMessage = encodeURIComponent(message);

  const whatsappURL = `${supplierWhatsAppLink}?text=${encodedMessage}`;

  // Update the request status
  await suppliesRequestModel.findByIdAndUpdate(
    reqId,
    { status: "Waiting" },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    whatsappURL,
  });
});
//====================================================================================================================//
// Send to station manager with totalCost calculation
export const sendToStation = asyncHandler(async (req, res, next) => {
  const { reqId, paymentMethod, totalLiters, pricePerLiter,status } = req.body;

  // Build update object
  const updateData = {
    paymentMethod,
    totalLiters,
    pricePerLiter,
    status,
  };
if (req.body.status!= "Review underway") {
  return next(
    new Error("Status should be 'Review underway'", { cause: 400 })
  );
}
  // Manually calculate totalCost if both values are present
  if (totalLiters != null && pricePerLiter != null) {
    updateData.totalCost = totalLiters * pricePerLiter;
  }

  const supplierReq = await suppliesRequestModel.findOneAndUpdate(
    {_id:reqId},
    updateData,
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    result: supplierReq,
  });
});
//====================================================================================================================//
//get all station supplier requests
export const getStaSupplierReq = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const targetLang = req.language || "en";

  const user = await userModel.findById(userId);
  if (!user) return next(new Error("User not found", { cause: 404 }));
  if (!user.station)
    return next(
      new Error("User is not assigned to any station", { cause: 400 })
    );

  const station = await stationModel.findById(user.station);
  if (!station) return next(new Error("Station not found", { cause: 404 }));

  // Step 1: Build the base query
  let mongooseQuery = suppliesRequestModel.find({ station: user.station });

  // Step 2: Apply ApiFeatures (filter, paginate, etc.)
  const apiFeatures = new ApiFeatures(mongooseQuery, req.query).filter();
  const paginationResult = await apiFeatures.paginate();

  // Step 3: Add populate and lean after features
  const supplierRequests = await apiFeatures.mongooseQuery
    .populate("stationDetails", "stationName")
    .populate(
      "supplierDetails",
      "supplierName phone supplierWhatsAppLink supplierAddress swiftCode IBAN"
    )
    .lean({ virtuals: true });

  // Step 4: Translate fuel types and statuses
  const uniqueFuelTypes = [
    ...new Set(supplierRequests.map((req) => req.fuelType)),
  ];
  const uniqueStatuses = [
    ...new Set(supplierRequests.map((req) => req.status)),
  ];

  const translatedFuelTypes = {};
  const translatedStatuses = {};

  await Promise.all(
    uniqueFuelTypes.map(async (type) => {
      const { translatedText } = await translateAutoDetect(type, targetLang);
      translatedFuelTypes[type] = translatedText;
    })
  );

  await Promise.all(
    uniqueStatuses.map(async (status) => {
      const { translatedText } = await translateAutoDetect(status, targetLang);
      translatedStatuses[status] = translatedText;
    })
  );

  const formattedRequests = supplierRequests.map((req) => {
    const stationName =
      req.stationDetails?.[0]?.stationName?.[targetLang] ||
      req.stationDetails?.[0]?.stationName?.en;

    const supplierData = req.supplierDetails?.[0];

    const supplierName =
      supplierData?.supplierName?.[targetLang] ||
      supplierData?.supplierName?.en;

    const supplierAddress =
      supplierData?.supplierAddress?.[targetLang] ||
      supplierData?.supplierAddress?.en;

    return {
      _id: req._id,
      employeeName: req.employeeName,
      station: req.station,
      supplier: req.supplier,
      fuelAmount: req.fuelAmount,
      fuelType: translatedFuelTypes[req.fuelType] || req.fuelType,
      status: translatedStatuses[req.status] || req.status,
      paymentMethod: req.paymentMethod,
      pricePerLiter: req.pricePerLiter,
      totalLiters: req.totalLiters,
      totalCost: req.totalCost,
      orderDate: req.orderDate,
      stationName,
      supplierName,
      phone: supplierData?.phone,
      supplierWhatsAppLink: supplierData?.supplierWhatsAppLink,
      supplierAddress,
      swiftCode: supplierData?.swiftCode,
      IBAN: supplierData?.IBAN,
    };
  });

  return res.status(200).json({
    status: "success",
    pagination: paginationResult,
    result: formattedRequests,
  });
});

//====================================================================================================================//
//review request
export const reviewRequest = asyncHandler(async (req, res, next) => {
  const { reqId, isCarCompleted, matchingSpecs, matchingSafety } = req.body;

  const customId = nanoid();
  const folder = `${process.env.APP_NAME}/SupplierRequest/${customId}`;

  // Helper to safely extract and upload a file field
  const uploadIfExists = async (fieldName, filenameLabel) => {
    const file = req.files?.[fieldName]?.[0];
    return file
      ? await uploadImageCloudinary(
          file,
          folder,
          `${customId}_${filenameLabel}`
        )
      : null;
  };

  // Upload all images in parallel
  const [carImage, specsImage, safetyImage, receiptImage] = await Promise.all([
    uploadIfExists("carImage", "carImage"),
    uploadIfExists("specsImage", "specsImage"),
    uploadIfExists("safetyImage", "safetyImage"),
    uploadIfExists("receiptImage", "receiptImage"),
  ]);

  // Update request
  const supplierReq = await suppliesRequestModel.findByIdAndUpdate(
    reqId,
    {
      carImage,
      specsImage,
      safetyImage,
      receiptImage,
      isCarCompleted,
      matchingSpecs,
      matchingSafety,
      customId,
    },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Order reviewed successfully",
    result: supplierReq,
  });
});
//====================================================================================================================//
//complete request
export const completeReq = asyncHandler(async (req, res, next) => {
  const { reqId } = req.params;
  const completeReq = await suppliesRequestModel.findByIdAndUpdate(
    reqId,
    { status: "Completed" },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Supplier request completed successfully",
    result: completeReq,
  });
});
//====================================================================================================================//
//delete request
export const deleteReq = asyncHandler(async (req, res, next) => {
  const { reqId } = req.params;

  const request = await suppliesRequestModel.findById(reqId);
  if (!request) return next(new Error("Request not found", { cause: 404 }));

  const folderBase = `${process.env.APP_NAME}/SupplierRequest/${request.customId}`;

  // Destroy individual images from Cloudinary
  const imageFields = ["carImage", "safetyImage", "specsImage", "receiptImage"];
  try {
    for (const field of imageFields) {
      const imageUrl = request[field];
      if (imageUrl) {
        await destroyCloudinaryFileFromUrl(imageUrl);
      }
    }

    // Optionally delete the folder after removing resources
    await deleteFromCloudinary(folderBase);
  } catch (error) {
    return next(
      new Error("Failed to delete images from Cloudinary", { cause: 500 })
    );
  }

  // Delete the request from DB
  await request.deleteOne();

  return res.status(200).json({
    status: "success",
    message: "Request and associated images deleted successfully.",
  });
});
