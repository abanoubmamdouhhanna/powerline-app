import { nanoid } from "nanoid";
import storagesModel from "../../../../DB/models/Storages.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import { deleteFromCloudinary, uploadImageCloudinary } from "../../../utils/cloudinaryHelpers.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//create storage
export const createStorage = asyncHandler(async (req, res, next) => {
  const { storageName, description, station, remainingNo } = req.body;
  const customId = nanoid();
  const storageImage = await uploadImageCloudinary(
    req.file,
    `${process.env.APP_NAME}/Storages/${customId}/storageImage`,
    `${customId}_storageImage`
  );
  const translatedStorageName = await translateMultiLang(storageName);
  const translatedDescription = await translateMultiLang(description);
  const storage = await storagesModel.create({
    customId,
    storageName: translatedStorageName,
    description: translatedDescription,
    station,
    remainingNo,
    storageImage,
  });
  res.status(201).json({
    status: "success",
    message: "Storage created successfully",
    result: storage,
  });
});
//====================================================================================================================//
//get all storages
export const getAllStorages = asyncHandler(async (req, res, next) => {
    const language = req.language || 'en'; // Default to English if language not specified
    
    const storages = await storagesModel.find().populate({
      path: "station",
      select: `stationName.${language} customId` // Only select the station name in the requested language and customId
    });
    
    // Map the storages to format the response according to the language
    const formattedStorages = storages.map(storage => ({
      storageName: storage.storageName[language],
      description: storage.description[language],
      _id: storage._id,
      customId: storage.customId,
      station: {
        stationName: storage.station?.stationName[language],
        _id: storage.station?._id
      },
      remainingNo: storage.remainingNo,
      storageImage: storage.storageImage,
      createdAt: storage.createdAt,
      updatedAt: storage.updatedAt
    }));
  
    res.status(200).json({
      status: "success",
      message: "Storages retrieved successfully",
      result: formattedStorages,
    });
  });
//====================================================================================================================//
//get storage by id
export const getStorageById = asyncHandler(async (req, res, next) => {
    const { storageId } = req.params;
    const language = req.language || 'en'; // Default to English if language not specified
    
    const storage = await storagesModel.findById(storageId).populate({
      path: "station",
      select: `stationName.${language} customId` // Only select the station name in the requested language and customId
    });
    
    if (!storage) {
      return next(new Error("Storage not found", { cause: 404 }));
    }
  
    // Format the storage object to include only the language-specific fields
    const formattedStorage = {
      storageName: storage.storageName[language],
      description: storage.description[language],
      _id: storage._id,
      customId: storage.customId,
      station: {
        stationName: storage.station?.stationName[language],
        _id: storage.station?._id
      },
      remainingNo: storage.remainingNo,
      storageImage: storage.storageImage,
      createdAt: storage.createdAt,
      updatedAt: storage.updatedAt
    };
  
    res.status(200).json({
      status: "success",
      message: "Storage retrieved successfully",
      result: formattedStorage,
    });
  });
//====================================================================================================================//
//update storage
export const updateStorage = asyncHandler(async (req, res, next) => {
  const { storageId } = req.params;
  const language = req.language || 'en'; // Default to English if language not specified
  const { storageName, description, station, remainingNo } = req.body;

  const storage = await storagesModel.findById(storageId);
  if (!storage) {
    return next(new Error("Storage not found", { cause: 404 }));
  }

  // Handle image upload if file is provided
  const storageImage = req.file
    ? await uploadImageCloudinary(
        req.file,
        `${process.env.APP_NAME}/Storages/${storage.customId}/storageImage`,
        `${storage.customId}_storageImage`
      )
    : storage.storageImage; // Keep existing image if no new file provided

  // Translate fields if provided
  const translatedStorageName = storageName
    ? await translateMultiLang(storageName)
    : undefined;
  const translatedDescription = description
    ? await translateMultiLang(description)
    : undefined;

  // Update storage
  const updatedStorage = await storagesModel.findByIdAndUpdate(
    storageId,
    {
      storageName: translatedStorageName || storage.storageName,
      description: translatedDescription || storage.description,
      station: station || storage.station,
      remainingNo: remainingNo !== undefined ? remainingNo : storage.remainingNo,
      storageImage
    },
    { new: true }
  ).populate({
    path: "station",
    select: `stationName.${language} customId` // Only populate station name in requested language
  });

  // Format the response according to the requested language
  const formattedResponse = {
    _id: updatedStorage._id,
    customId: updatedStorage.customId,
    storageName: updatedStorage.storageName?.[language],
    description: updatedStorage.description?.[language],
    station: {
      _id: updatedStorage.station?._id,
      customId: updatedStorage.station?.customId,
      stationName: updatedStorage.station?.stationName?.[language]
    },
    remainingNo: updatedStorage.remainingNo,
    storageImage: updatedStorage.storageImage,
    createdAt: updatedStorage.createdAt,
    updatedAt: updatedStorage.updatedAt
  };

  res.status(200).json({
    status: "success",
    message: "Storage updated successfully",
    result: formattedResponse,
  });
});
//====================================================================================================================//
//delete storage
export const deleteStorage = asyncHandler(async (req, res, next) => {
  const { storageId } = req.params;
  const storage = await storagesModel.findById(storageId);
  if (!storage) {
    return next(new Error("Storage not found", { cause: 404 }));
  }
  await deleteFromCloudinary(
    `${process.env.APP_NAME}/Storages/${storage.customId}`
  );
  await storage.deleteOne();
  res.status(200).json({
    status: "success",
    message: "Storage deleted successfully",
  });
});
//====================================================================================================================//
