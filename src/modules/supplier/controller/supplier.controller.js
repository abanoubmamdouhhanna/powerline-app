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
    return next(new Error("Supplier not found", { cause: 404 }));
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

  const folder = `${process.env.APP_NAME}/Suppliers/${supplier.customId}/supplierImage`;
  // Handle image upload if file is sent
  const imageUploadPromise = req.file
    ? uploadImageCloudinary(
        req.file,
        folder,
        `${supplier.customId}_supplierImage`
      )
    : Promise.resolve(null);

  const uploadResult = await imageUploadPromise;

  updates.supplierImage = uploadResult?.secure_url || supplier.supplierImage;

  // Apply updates
  const updatedSupplier = await supplierModel.findByIdAndUpdate(
    supplierId,
    updates,
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Supplier updated successfully",
    supplier: updatedSupplier,
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
      "supplier station fuelAmount fuelType status carImage receiptImage safetyImage specsImage"
    )
    .populate("stationDetails", "stationName")
    .populate(
      "supplierDetails",
      "supplierName phone supplierWhatsAppLink supplierAddress swiftCode IBAN"
    )
    .lean({ virtuals: true });

  // Extract unique fuelTypes and statuses for batch translation
  const uniqueFuelTypes = [
    ...new Set(supplierRequests.map((req) => req.fuelType)),
  ];
  const uniqueStatuses = [
    ...new Set(supplierRequests.map((req) => req.status)),
  ];

  // Translate fuelTypes and statuses
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

  // Format final result with translations
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
      phone: supplierData?.phone,
      supplierWhatsAppLink: supplierData?.supplierWhatsAppLink,
      supplierAddress,
      swiftCode: supplierData?.swiftCode,
      IBAN: supplierData?.IBAN,
      carImage: req.carImage,
      receiptImage: req.receiptImage,
      safetyImage: req.safetyImage,
      specsImage: req.specsImage,
    };
  });

  return res.status(200).json({
    status: "success",
    result: formattedRequests,
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
  const { reqId, paymentMethod, totalLiters, pricePerLiter } = req.body;

  // Build update object
  const updateData = {
    paymentMethod,
    totalLiters,
    pricePerLiter,
    status: "Review underway",
  };

  // Manually calculate totalCost if both values are present
  if (totalLiters != null && pricePerLiter != null) {
    updateData.totalCost = totalLiters * pricePerLiter;
  }

  const supplierReq = await suppliesRequestModel.findByIdAndUpdate(
    reqId,
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

  // Validate user
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  if (!user.station) {
    return next(
      new Error("User is not assigned to any station", { cause: 400 })
    );
  }

  const station = await stationModel.findById(user.station);
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  // Get requests for this station
  const supplierRequests = await suppliesRequestModel
    .find(
      { station: user.station },
      "supplier station fuelAmount fuelType status paymentMethod pricePerLiter totalLiters totalCost"
    )
    .populate("stationDetails", "stationName")
    .populate(
      "supplierDetails",
      "supplierName phone supplierWhatsAppLink supplierAddress swiftCode IBAN"
    )
    .lean({ virtuals: true });

  // Extract unique fuelTypes and statuses
  const uniqueFuelTypes = [
    ...new Set(supplierRequests.map((req) => req.fuelType)),
  ];
  const uniqueStatuses = [
    ...new Set(supplierRequests.map((req) => req.status)),
  ];

  // Translate them
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
      paymentMethod: req.paymentMethod,
      pricePerLiter: req.pricePerLiter,
      totalLiters: req.totalLiters,
      totalCost: req.totalCost,
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
    },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Order reviewed successfully",
    result: supplierReq,
  });
});
