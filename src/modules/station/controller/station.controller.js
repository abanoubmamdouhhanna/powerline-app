import { nanoid } from "nanoid";
import gasolineTypeModel from "../../../../DB/models/GasolineType.model.js";
import pumpModel from "../../../../DB/models/Pump.model.js";
import stationModel from "../../../../DB/models/Station.model.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { capitalizeWords } from "../../../utils/capitalize.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import {
  deleteFromCloudinary,
  destroyCloudinaryFileFromUrl,
  uploadImageCloudinary,
  uploadToCloudinary,
} from "../../../utils/cloudinaryHelpers.js";
import translateAutoDetect from "../../../../languages/api/translateAutoDetect.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";

// add gasoline type
export const addGasoline = asyncHandler(async (req, res, next) => {
  const { gasolineName } = req.body;

  if (!gasolineName) {
    return next(new Error("Gasoline name is required", { cause: 400 }));
  }

  // Detect language and translate to others
  const targetLangs = ["en", "ar", "bn"];
  const translations = {};

  const { translatedText, detectedLang } = await translateAutoDetect(
    gasolineName,
    "en"
  ); // Detect

  translations[detectedLang] = gasolineName; // Original entry

  // Translate to the other languages
  const remainingLangs = targetLangs.filter((lang) => lang !== detectedLang);

  await Promise.all(
    remainingLangs.map(async (lang) => {
      const result = await translateAutoDetect(gasolineName, lang);
      translations[lang] = result.translatedText;
    })
  );

  const gasoline = await gasolineTypeModel.create({
    gasolineName: translations,
  });

  return res.status(201).json({
    message: getTranslation("Gasoline type added successfully", req.language),
    result: gasoline,
  });
});

//====================================================================================================================//
//add pump
export const addPump = asyncHandler(async (req, res, next) => {
  const { station, pumpName, pistolTypes } = req.body;

  if (
    !station ||
    !pumpName ||
    !Array.isArray(pistolTypes) ||
    pistolTypes.length === 0
  ) {
    return next(
      new Error(
        "All fields are required: station, pumpName, and pistolTypes.",
        { cause: 400 }
      )
    );
  }

  const isStationValid = await stationModel.exists({ _id: station });
  if (!isStationValid)
    return next(new Error("Station not found.", { cause: 404 }));

  const validGasolines = await gasolineTypeModel.find({
    _id: { $in: pistolTypes },
  });
  if (validGasolines.length !== pistolTypes.length) {
    return next(
      new Error("One or more pistol types are invalid.", { cause: 400 })
    );
  }

  // Auto-detect original language and translate pumpName
  const nameEN = await translateAutoDetect(pumpName, "en");
  const nameAR = await translateAutoDetect(pumpName, "ar");
  const nameBN = await translateAutoDetect(pumpName, "bn");

  const pump = await pumpModel.create({
    station,
    pistolTypes,
    pumpName: {
      en: nameEN.translatedText,
      ar: nameAR.translatedText,
      bn: nameBN.translatedText,
    },
  });

  return res.status(201).json({
    message: getTranslation("Pump created successfully.", req.language),
    result: pump,
  });
});

//====================================================================================================================//
//get pumps for station
export const getPumps = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;
  const targetLang = req.language;

  const station = await stationModel.findOne({ _id: stationId });
  if (!station) return next(new Error("Station not found", { cause: 404 }));

  const allPumps = await pumpModel.find({ station: stationId });

  const localizedPumps = allPumps.map((pump) => ({
    _id: pump._id,
    station: pump.station,
    pistolTypes: pump.pistolTypes,
    pumpName: pump.pumpName?.[targetLang] || pump.pumpName?.en || "N/A", // fallback to English
    createdAt: pump.createdAt,
    updatedAt: pump.updatedAt,
  }));

  return res.status(200).json({
    status: "success",
    result: localizedPumps,
  });
});

//====================================================================================================================//
//get gasoline types for pump

export const getPumpTypes = asyncHandler(async (req, res, next) => {
  const { pumpId, stationId } = req.body;
  const targetLang = req.language || "en"; // Default to "en" if no language is specified

  // Validate if pump exists for the given station
  const isPumpValid = await pumpModel.exists({
    _id: pumpId,
    station: stationId,
  });
  if (!isPumpValid) return next(new Error("Pump not found.", { cause: 404 }));

  const pump = await pumpModel
    .findOne({ _id: pumpId, station: stationId }, "pistolTypes")
    .populate({
      path: "pistolTypes",
      select: "gasolineName",
      model: "GasolineType",
    });

  if (!pump) return next(new Error("Pump not found.", { cause: 404 }));

  const translatedPistolTypes = pump.pistolTypes.map((pistolType) => {
    const gasolineName =
      pistolType.gasolineName[targetLang] || pistolType.gasolineName["en"];
    return {
      _id: pistolType._id,
      gasolineName, // Use the translated name
    };
  });

  return res.status(200).json({
    status: "success",
    result: {
      ...pump.toObject(),
      pistolTypes: translatedPistolTypes,
    },
  });
});

//====================================================================================================================//
// add station
export const addStation = asyncHandler(async (req, res, next) => {
  const {
    stationName,
    stationAddress,
    noOfPumps,
    noOfPistol,
    supplier,
    noOfGreenPistol,
    noOfRedPistol,
    noOfDieselPistol,
    documents: documentsData,
    stores: storesData,
  } = req.body;

  // 1. Translate station name and address
  const translatedStationName = await translateMultiLang(
    capitalizeWords(stationName)
  );
  const translatedStationAddress = await translateMultiLang(stationAddress);
  const customId = nanoid();

  // 2. Uploaded files map
  const uploadedFiles = req.files || {};

  // 3. Process station-level documents
  const processedDocuments = Array.isArray(documentsData)
    ? await Promise.all(
        documentsData.map(async (doc, i) => {
          const { title, start, end } = doc;
          if (!title || !start || !end) {
            throw new Error(
              "Each station document must have title, start date, and end date"
            );
          }

          const translatedTitle = await translateMultiLang(title);
          const files = uploadedFiles[`documentFiles_${i}`] || [];

          const folder = `${process.env.APP_NAME}/Stations/${customId}/documents/document_${i}`;
          const fileUploads = await Promise.all(
            files.map((file) =>
              uploadToCloudinary(
                file,
                folder,
                `${customId}_stationDoc_${i}_${file.originalname}`
              )
            )
          );

          return {
            title: translatedTitle,
            start: new Date(start),
            end: new Date(end),
            files: fileUploads,
          };
        })
      )
    : [];

  // 4. Process each store
  const processedStores = Array.isArray(storesData)
    ? await Promise.all(
        storesData.map(async (store, i) => {
          const { storeName, description, residenceExpiryDate } = store;

          if (!storeName || !description || !residenceExpiryDate) {
            throw new Error(
              "Each store must have storeName, description, and residenceExpiryDate"
            );
          }

          const translatedStoreName = await translateMultiLang(
            capitalizeWords(storeName)
          );
          const translatedDescription = await translateMultiLang(description);

          const baseFolder = `${process.env.APP_NAME}/Stations/${customId}/stores/store_${i}`;

          // leaseDoc
          const leaseFiles = uploadedFiles[`leaseDoc_${i}`] || [];
          if (leaseFiles.length !== 1) {
            return next(
              new Error("Each store must have exactly one leaseDoc file", {
                cause: 400,
              })
            );
          }

          const leaseDoc = await uploadToCloudinary(
            leaseFiles[0],
            `${baseFolder}/leaseDoc`,
            `${customId}_storeLease_${i}_${leaseFiles[0].originalname}`
          );

          // shopImage (optional)
          const shopImageFile = uploadedFiles[`shopImage_${i}`]?.[0] || null;
          const shopImage = shopImageFile
            ? await uploadImageCloudinary(
                shopImageFile,
                `${baseFolder}/shopImage`,
                `${customId}_storeImage`
              )
            : null;

          return {
            storeName: translatedStoreName,
            description: translatedDescription,
            leaseDoc,
            shopImage,
            residenceExpiryDate: new Date(residenceExpiryDate),
          };
        })
      )
    : [];

  // 5. Create and respond
  const newStation = await stationModel.create({
    customId,
    stationName: translatedStationName,
    stationAddress: translatedStationAddress,
    noOfPumps,
    noOfPistol,
    supplier,
    noOfGreenPistol,
    noOfRedPistol,
    noOfDieselPistol,
    documents: processedDocuments,
    stores: processedStores,
  });

  return res.status(201).json({
    message: "Station added successfully",
    result: newStation,
  });
});

//====================================================================================================================//
//get all stations
export const getAllStations = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en"; // fallback to 'en'

  const stations = await stationModel
    .find({}, "stationName employees")
    .populate("stationEmployees", "name imageUrl permissions");

  const enrichedStations = stations.map((station) => {
    const nameField = station.stationName;
    const translatedName =
      typeof nameField === "object"
        ? nameField[targetLang] || nameField.en || Object.values(nameField)[0]
        : nameField;

    return {
      _id: station._id,
      stationName: translatedName,
      stationEmployees: station.stationEmployees,
      employeeCount: station.stationEmployees.length,
    };
  });

  return res.status(200).json({
    message: "Success",
    result: enrichedStations,
  });
});

//====================================================================================================================//
//get sp station
export const getSpStation = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;
  const targetLang = req.language || "en";

  const station = await stationModel.findOne({ _id: stationId });
  if (!station) return next(new Error("Station not found", { cause: 404 }));

  const getField = (fieldObj) => {
    if (typeof fieldObj === "object") {
      return fieldObj[targetLang] || fieldObj.en || Object.values(fieldObj)[0];
    }
    return fieldObj;
  };

  return res.status(200).json({
    message: "Success",
    result: {
      ...station.toObject(),
      stationName: getField(station.stationName),
      stationAddress: getField(station.stationAddress),
    },
  });
});

//====================================================================================================================//
//update station
export const updateStation = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;

  const {
    stationName,
    stationAddress,
    noOfPumps,
    noOfPistol,
    supplier,
    noOfGreenPistol,
    noOfRedPistol,
    noOfDieselPistol,
  } = req.body;

  const updatedFields = {};

  // Translate stationName if provided
  if (stationName) {
    const formattedStationName = capitalizeWords(stationName);
    updatedFields.stationName = await translateMultiLang(formattedStationName);
  }

  // Translate stationAddress if provided
  if (stationAddress) {
    updatedFields.stationAddress = await translateMultiLang(stationAddress);
  }

  if (noOfPumps !== undefined) updatedFields.noOfPumps = noOfPumps;
  if (noOfPistol !== undefined) updatedFields.noOfPistol = noOfPistol;
  if (supplier) updatedFields.supplier = supplier;
  if (noOfGreenPistol !== undefined)
    updatedFields.noOfGreenPistol = noOfGreenPistol;
  if (noOfRedPistol !== undefined) updatedFields.noOfRedPistol = noOfRedPistol;
  if (noOfDieselPistol !== undefined)
    updatedFields.noOfDieselPistol = noOfDieselPistol;

  const updatedStation = await stationModel.findByIdAndUpdate(
    stationId,
    { $set: updatedFields },
    { new: true, runValidators: true }
  );

  if (!updatedStation) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  return res.status(200).json({
    message: "Station updated successfully",
    result: updatedStation,
  });
});

//====================================================================================================================//
//delete station
export const deleteStation = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;

  // Fetch the existing station
  const existingStation = await stationModel.findOne({ _id: stationId });
  if (!existingStation) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  const folderBase = `${process.env.APP_NAME}/Stations/${existingStation.customId}`;

  // 1. Delete station documents
  const fileInfos = existingStation.documents.flatMap((doc) => doc.files);
  const leaseDocs = existingStation.stores.flatMap((store) => store.leaseDoc);

  // Combine all files to delete into a single array
  const allFilesToDelete = [...fileInfos, ...leaseDocs];

  try {
    // 2. Delete each file from Cloudinary
    await Promise.all(
      allFilesToDelete.map(({ public_id, resource_type }) =>
        cloudinary.uploader.destroy(public_id, { resource_type })
      )
    );
  } catch (error) {
    return next(
      new Error(`Error deleting files from Cloudinary: ${error.message}`, {
        cause: 500,
      })
    );
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
    await existingStation.deleteOne();
  } catch (error) {
    return next(
      new Error(`Error deleting station from database: ${error.message}`, {
        cause: 500,
      })
    );
  }

  // Return success response
  return res.status(200).json({ message: "Station deleted successfully" });
});
//====================================================================================================================//
//delete document
export const deleteDocument = asyncHandler(async (req, res, next) => {
  const { docId, stationId } = req.body;
  const station = await stationModel.findOne({ _id: stationId });
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }
  const documentIndex = station.documents.findIndex(
    (doc) => doc._id.toString() === docId
  );
  if (documentIndex === -1) {
    return next(new Error("Document not found", { cause: 404 }));
  }
  const [documentToDelete] = station.documents.splice(documentIndex, 1);
  const files = documentToDelete.files;

  if (!files.length) {
    return next(
      new Error("No files to delete in this document", { cause: 404 })
    );
  }
  // Extract folderBase from the first file's public_id
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

  await station.save();

  return res.status(200).json({
    message: "Document and associated files & folder deleted successfully",
  });
});
//====================================================================================================================//
// add new document
export const addStationDocument = asyncHandler(async (req, res, next) => {
  const { stationId, title, start, end } = req.body;

  if (!title || !start || !end || !req.files) {
    return next(
      new Error("Missing required fields or document files", { cause: 400 })
    );
  }
  const station = await stationModel.findOne({ _id: stationId });
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }
  const documentIndex = station.documents.length;
  const folder = `${process.env.APP_NAME}/Stations/${station.customId}/documents/document_${documentIndex}`;

  const uploadedFiles = await Promise.all(
    Object.values(req.files)
      .flat()
      .map((file) =>
        uploadToCloudinary(
          file,
          folder,
          `${station.customId}_stationDoc_${documentIndex}_${file.originalname}`
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

  station.documents.push(newDocument);
  await station.save();

  return res.status(201).json({
    message: "Document added successfully",
    document: station.documents.at(-1),
  });
});
//====================================================================================================================//
//delete store
export const deleteStore = asyncHandler(async (req, res, next) => {
  const { storeId, stationId } = req.body;

  // Step 1: Find the station
  const station = await stationModel.findById(stationId);
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  // Step 2: Find the store within the station
  const storeIndex = station.stores.findIndex(
    (store) => store._id.toString() === storeId
  );

  if (storeIndex === -1) {
    return next(new Error("Store not found", { cause: 404 }));
  }

  // Step 3: Get the store to delete
  const [storeToDelete] = station.stores.splice(storeIndex, 1);
  const { leaseDoc, shopImage } = storeToDelete;

  // Step 4: Check if lease document exists
  if (!leaseDoc || !leaseDoc.public_id) {
    return next(
      new Error("No lease document found for this store", { cause: 404 })
    );
  }

  // Step 5: Get the folder base for cleanup (excluding leaseDoc folder)
  const storeFolder = leaseDoc.public_id.split("/").slice(0, -2).join("/");

  try {
    // Step 6: Parallelize deletions
    const deletionTasks = [];

    // Delete lease document
    deletionTasks.push(
      cloudinary.uploader.destroy(leaseDoc.public_id, {
        resource_type: leaseDoc.resource_type || "raw",
      })
    );

    // Delete shop image if it exists
    if (shopImage) {
      deletionTasks.push(destroyCloudinaryFileFromUrl(shopImage));
    }

    // Execute all deletions in parallel
    const [leaseResult, shopImageResult] = await Promise.all(deletionTasks);

    // Step 7: Handle lease document deletion result
    if (leaseResult.result !== "ok") {
      console.warn(`Lease document deletion warning:`, leaseResult);
    } else {
      console.log(`Lease document ${leaseDoc.public_id} deleted successfully.`);
    }

    // Step 8: Handle shop image deletion result (if it was deleted)
    if (shopImage && shopImageResult) {
      console.log(`Shop image ${shopImage} deleted successfully.`);
    }

    // Step 9: Optional folder cleanup (best effort)
    try {
      await deleteFromCloudinary(storeFolder);
      console.log(`Folder ${storeFolder} deleted successfully.`);
    } catch (folderErr) {
      console.warn(`Could not delete folder ${storeFolder}:`, folderErr);
    }
  } catch (err) {
    console.error("Cloudinary deletion failed:", err);
    return next(
      new Error("Failed to delete store files from Cloudinary", { cause: 500 })
    );
  }

  // Step 10: Save the updated station document
  await station.save();

  // Step 11: Return success response
  return res.status(200).json({
    message:
      "Store deleted successfully, including lease document and shop image",
  });
});
//====================================================================================================================//
// add new store
export const addStationStore = asyncHandler(async (req, res, next) => {
  const { stationId, storeName, description, residenceExpiryDate } = req.body;

  // Step 1: Validate inputs
  if (!storeName || !description || !residenceExpiryDate || !req.files) {
    return next(
      new Error("Missing required fields or document files", { cause: 400 })
    );
  }

  // Step 2: Find the station
  const station = await stationModel.findById(stationId);
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  // Step 3: Create folder path for storing files
  const storeIndex = station.stores.length;
  const folder = `${process.env.APP_NAME}/Stations/${station.customId}/stores/store_${storeIndex}`;

  // Step 4: Upload lease documents
  const leaseFiles = Object.values(req.files.leaseDoc || []);
  if (leaseFiles.length === 0) {
    return next(new Error("No lease documents uploaded", { cause: 400 }));
  }

  if (leaseFiles.length !== 1) {
    return next(
      new Error("Each store must have exactly one leaseDoc file", {
        cause: 400,
      })
    );
  }

  const uploadedLeaseDocs = await Promise.all(
    leaseFiles.map((file) =>
      uploadToCloudinary(
        file,
        `${folder}/leaseDoc`,
        `${station.customId}_storeLease_${storeIndex}_${file.originalname}`
      )
    )
  );

  // Step 5: Upload shop image (optional)
  const shopImageFile = req.files.shopImage?.[0] ?? null;
  const shopImage = shopImageFile
    ? await uploadImageCloudinary(
        shopImageFile,
        `${folder}/shopImage`,
        `${station.customId}_storeImage`
      )
    : null;

  // Step 6: Translate fields
  const translatedStoreName = await translateMultiLang(storeName);
  const translatedDescription = await translateMultiLang(description);

  // Step 7: Create new store object
  const newStore = {
    storeName: translatedStoreName,
    description: translatedDescription,
    residenceExpiryDate: new Date(residenceExpiryDate),
    leaseDoc: uploadedLeaseDocs[0],
    shopImage,
  };

  // Step 8: Add store to station and save
  station.stores.push(newStore);
  await station.save();

  // Step 9: Return success response
  return res.status(201).json({
    message: "Store added successfully",
    store: station.stores.at(-1),
  });
});
