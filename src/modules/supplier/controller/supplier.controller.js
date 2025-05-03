import { nanoid } from "nanoid";
import supplierModel from "../../../../DB/models/Supplier.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import {
  deleteFromCloudinary,
  destroyCloudinaryFileFromUrl,
  uploadImageCloudinary,
} from "../../../utils/cloudinaryHelpers.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

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
    return next(new Error("Supplier not found", {cause:404}));
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
