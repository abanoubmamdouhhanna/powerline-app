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
import gasolineModel from "../../../../DB/models/GasolinePrice.model.js";
import cleaningTaskModel from "../../../../DB/models/CleaningTask.model.js";
import inventoryTaskModel from "../../../../DB/models/InventoryTask.model.js";
import attendanceModel from "../../../../DB/models/Attendance.model.js";

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
    message: getTranslation("Station added successfully", req.language),
    result: newStation,
  });
});

//====================================================================================================================//
//get all stations
export const getAllStations = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en"; // fallback to 'en'

  const stations = await stationModel
    .find({}, "stationName employees")
    .populate("stationEmployees", "name imageUrl permissions"); // assuming 'name' is the field that might be translated

  const enrichedStations = stations.map((station) => {
    // Translate station name
    const stationNameField = station.stationName;
    const translatedStationName =
      typeof stationNameField === "object"
        ? stationNameField[targetLang] ||
          stationNameField.en ||
          Object.values(stationNameField)[0]
        : stationNameField;

    // Translate employee names
    const translatedEmployees = station.stationEmployees.map((employee) => {
      const employeeNameField = employee.name;
      const translatedEmployeeName =
        typeof employeeNameField === "object"
          ? employeeNameField[targetLang] ||
            employeeNameField.en ||
            Object.values(employeeNameField)[0]
          : employeeNameField;

      return {
        _id: employee._id,
        name: translatedEmployeeName,
        imageUrl: employee.imageUrl,
        permissions: employee.permissions,
      };
    });

    return {
      _id: station._id,
      stationName: translatedStationName,
      stationEmployees: translatedEmployees,
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

  const stationObj = station.toObject();

  // Translate document titles
  if (Array.isArray(stationObj.documents)) {
    stationObj.documents = stationObj.documents.map((doc) => ({
      ...doc,
      title: getField(doc.title),
    }));
  }

  // Translate store name and description
  if (Array.isArray(stationObj.stores)) {
    stationObj.stores = stationObj.stores.map((store) => ({
      ...store,
      storeName: getField(store.storeName),
      description: getField(store.description),
    }));
  }

  // Translate main station fields
  stationObj.stationName = getField(stationObj.stationName);
  stationObj.stationAddress = getField(stationObj.stationAddress);

  return res.status(200).json({
    message: "Success",
    result: stationObj,
  });
});

//====================================================================================================================//
//update station
export const updateStation = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;
  const language = req.language || "en"; // Default to English if language not specified
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
  const formattedResponse = {
    _id: updatedStation._id,
    customId: updatedStation.customId,
    stationName: updatedStation.stationName?.[language],
    stationAddress: updatedStation.stationAddress?.[language],
    noOfPumps: updatedStation.noOfPumps,
    noOfPistol: updatedStation.noOfPistol,
    supplier: updatedStation.supplier,
    noOfGreenPistol: updatedStation.noOfGreenPistol,
    noOfRedPistol: updatedStation.noOfRedPistol,
    noOfDieselPistol: updatedStation.noOfDieselPistol,
    isDeleted: updatedStation.isDeleted,
    createdAt: updatedStation.createdAt,
    updatedAt: updatedStation.updatedAt,
  };
  return res.status(200).json({
    message: getTranslation("Station updated successfully", language),
    result: formattedResponse,
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
  return res.status(200).json({
    message: getTranslation("Station deleted successfully", req.language),
  });
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
    message: getTranslation(
      "Document and associated files & folder deleted successfully",
      req.language
    ),
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
    message: getTranslation("Document added successfully", req.language),
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
    message: getTranslation(
      "Store deleted successfully, including lease document and shop image",
      req.language
    ),
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
    message: getTranslation("Store added successfully", req.language),
    store: station.stores.at(-1),
  });
});
//====================================================================================================================//
//add gasoline price
export const addGasolinePrice = asyncHandler(async (req, res, next) => {
  const { station, redPrice, greenPrice, dieselPrice } = req.body;

  // Validate required fields
  if (!station || !redPrice || !greenPrice || !dieselPrice) {
    return next(
      new Error("All fields are required", {
        cause: 400,
      })
    );
  }

  // Check if station exists
  const stationExists = await stationModel.exists({ _id: station });
  if (!stationExists) {
    return next(new Error("Station not found.", { cause: 404 }));
  }

  // Check if price already exists for this station and gasoline type
  const existingPrice = await gasolineModel.findOne({
    station,
  });

  if (existingPrice) {
    return next(
      new Error(
        "A price already exists for this station and gasoline type combination. Use update instead.",
        {
          cause: 400,
        }
      )
    );
  }

  // Create new price if no existing record found
  const newPrice = await gasolineModel.create({
    station,
    redPrice,
    greenPrice,
    dieselPrice,
  });

  return res.status(201).json({
    message: getTranslation("Price added successfully", req.language),
    result: newPrice,
  });
});
//====================================================================================================================//
//update gasoline prices
export const updateGasolinePrice = asyncHandler(async (req, res, next) => {
  const { priceId } = req.params;
  const { redPrice, greenPrice, dieselPrice } = req.body;
  const language = req.language || "en";

  // Update the price and populate related data
  const updatedPrice = await gasolineModel
    .findByIdAndUpdate(
      priceId,
      { redPrice, greenPrice, dieselPrice },
      { new: true }
    )
    .populate([
      {
        path: "station",
        select: "stationName customId",
        model: "Station",
      },
    ]);

  if (!updatedPrice) {
    return next(
      new Error("Gasoline price not found", {
        cause: 404,
      })
    );
  }

  // Format the response with language-specific fields
  const formattedResponse = {
    _id: updatedPrice._id,
    redPrice: updatedPrice.redPrice,
    greenPrice: updatedPrice.greenPrice,
    dieselPrice: updatedPrice.dieselPrice,
    station:
      updatedPrice.station.stationName?.[language] ||
      updatedPrice.station.stationName?.en ||
      Object.values(updatedPrice.station.stationName)[0],
    createdAt: updatedPrice.createdAt,
    updatedAt: updatedPrice.updatedAt,
  };

  return res.status(200).json({
    status: "success",
    message: getTranslation("Price updated successfully", language),
    result: formattedResponse,
  });
});
//====================================================================================================================//
//get gasoline prices
export const getGasolinePrices = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;
  const targetLang = req.language || "en";

  const gasolinePrices = await gasolineModel
    .find({ station: stationId })
    .populate([
      {
        path: "station",
        select: "stationName",
        model: "Station",
      },
    ]);

  if (!gasolinePrices || gasolinePrices.length === 0) {
    return next(
      new Error("No gasoline prices found for this station", { cause: 404 })
    );
  }

  const translatedPrices = gasolinePrices.map((price) => ({
    _id: price._id,
    station:
      price.station.stationName?.[targetLang] ||
      price.station.stationName?.en ||
      Object.values(price.station.stationName)[0],
    redPrice: price.redPrice,
    greenPrice: price.greenPrice,
    dieselPrice: price.dieselPrice,
    createdAt: price.createdAt,
    updatedAt: price.updatedAt,
  }));

  return res.status(200).json({
    status: "success",
    result: translatedPrices,
  });
});
//====================================================================================================================//
//get job tasks
export const getJobTasks = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;
  const targetLang = req.language || "en"; // Fallback to English

  // 1. Find user
  const station = await stationModel.findById(stationId);
  if (!station) {
    return next(new Error("station not found", { cause: 404 }));
  }
  const employeeId = station.employee;

  // 2. Fetch cleaning tasks with createdAt
  const cleaningTasksRaw = await cleaningTaskModel.find(
    { station: stationId },
    "subTask date time location employeeName cleaningImages createdAt"
  );

  const cleaningTasks = await Promise.all(
    cleaningTasksRaw.map(async (task) => {
      const [employeeNameTranslation, subTaskTranslation] = await Promise.all([
        translateAutoDetect(task.employeeName, targetLang),
        translateAutoDetect(task.subTask, targetLang),
      ]);

      return {
        type: "cleaning",
        _id: task._id,
        subTask: subTaskTranslation.translatedText,
        date: task.date,
        time: task.time,
        location: task.location, // no translation
        employeeName: employeeNameTranslation.translatedText,
        cleaningImages: task.cleaningImages,
        createdAt: task.createdAt,
      };
    })
  );

  // 3. Fetch inventory tasks with createdAt
  const inventoryTasksRaw = await inventoryTaskModel
    .find(
      { station: stationId },
      "subTask date time location employeeName inventoryImages pumps createdAt"
    )
    .populate({
      path: "pumps.pump",
      select: "pumpName",
    })
    .populate({
      path: "pumps.pistols.pistol",
      select: "gasolineName",
    });

  const inventoryTasks = await Promise.all(
    inventoryTasksRaw.map(async (task) => {
      const [employeeNameTranslation, subTaskTranslation] = await Promise.all([
        translateAutoDetect(task.employeeName, targetLang),
        translateAutoDetect(task.subTask, targetLang),
      ]);

      return {
        type: "inventory",
        _id: task._id,
        subTask: subTaskTranslation.translatedText,
        date: task.date,
        time: task.time,
        location: task.location, // no translation
        employeeName: employeeNameTranslation.translatedText,
        inventoryImages: task.inventoryImages,
        pumps: task.pumps.map((pumpItem) => ({
          _id: pumpItem._id,
          pump:
            typeof pumpItem.pump?.pumpName === "object"
              ? pumpItem.pump.pumpName[targetLang] ||
                pumpItem.pump.pumpName.en ||
                Object.values(pumpItem.pump.pumpName)[0]
              : pumpItem.pump?.pumpName || null,
          pistols: pumpItem.pistols.map((pistolItem) => ({
            _id: pistolItem._id,
            pistol:
              typeof pistolItem.pistol?.gasolineName === "object"
                ? pistolItem.pistol.gasolineName[targetLang] ||
                  pistolItem.pistol.gasolineName.en ||
                  Object.values(pistolItem.pistol.gasolineName)[0]
                : pistolItem.pistol?.gasolineName || null,
            counterNumber: pistolItem.counterNumber,
          })),
        })),
        createdAt: task.createdAt,
      };
    })
  );

  // 4. Merge and sort by createdAt descending
  const allTasks = [...cleaningTasks, ...inventoryTasks].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // 5. Send final response
  return res.status(200).json({
    status: "success",
    data: allTasks,
  });
});
//====================================================================================================================//
//station attendance
export const stationAttendance = asyncHandler(async (req, res, next) => {
  const { stationId } = req.params;
  const targetLanguage = req.language;

  const station = await stationModel.findById(stationId);
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  const attendance = await attendanceModel
    .find(
      { station: stationId },
      "date checkIn checkOut workingHours status user"
    )
    .populate({
      path: "user",
      select: `name.${targetLanguage}`,
    });

  const statusColorMap = {
    "On Time": "green",
    Late: "red",
    Absent: "warning",
    "Day Off": "blue",
  };

  // Translate statuses only once for optimization
  const statusSet = new Set(attendance.map((entry) => entry.status));
  const translatedStatuses = {};

  for (const status of statusSet) {
    const { translatedText } = await translateAutoDetect(
      status,
      targetLanguage
    );
    translatedStatuses[status] = translatedText;
  }

  const formattedAttendance = attendance.map((entry) => {
    const { _id, date, checkIn, checkOut, workingHours, status } = entry;

    return {
      _id,
      date,
      checkIn,
      checkOut,
      workingHours,
      status: translatedStatuses[status],
      employeeName: entry.user?.name?.[targetLanguage] || "Unknown",
      statusColor: statusColorMap[status],
    };
  });

  return res.status(201).json({
    status: "success",
    attendanceDays: attendance.length,
    result: formattedAttendance,
  });
});

//====================================================================================================================//
//get job task by id
export const getJobTaskById = asyncHandler(async (req, res, next) => {
  const { stationId, taskId } = req.params;
  const targetLang = req.language || "en"; // Fallback to English

  // 1. Verify station exists
  const station = await stationModel.findById(stationId);
  if (!station) {
    return next(new Error("Station not found", { cause: 404 }));
  }

  // 2. Try finding task in cleaning tasks
  const cleaningTask = await cleaningTaskModel.findOne({
    _id: taskId,
    station: stationId,
  });

  if (cleaningTask) {
    const [employeeNameTranslation, subTaskTranslation] = await Promise.all([
      translateAutoDetect(cleaningTask.employeeName, targetLang),
      translateAutoDetect(cleaningTask.subTask, targetLang),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        type: "cleaning",
        _id: cleaningTask._id,
        subTask: subTaskTranslation.translatedText,
        date: cleaningTask.date,
        time: cleaningTask.time,
        location: cleaningTask.location,
        employeeName: employeeNameTranslation.translatedText,
        cleaningImages: cleaningTask.cleaningImages,
        createdAt: cleaningTask.createdAt,
      },
    });
  }

  // 3. Try finding task in inventory tasks
  const inventoryTask = await inventoryTaskModel
    .findOne({ _id: taskId, station: stationId })
    .populate({
      path: "pumps.pump",
      select: "pumpName",
    })
    .populate({
      path: "pumps.pistols.pistol",
      select: "gasolineName",
    });

  if (inventoryTask) {
    const [employeeNameTranslation, subTaskTranslation] = await Promise.all([
      translateAutoDetect(inventoryTask.employeeName, targetLang),
      translateAutoDetect(inventoryTask.subTask, targetLang),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        type: "inventory",
        _id: inventoryTask._id,
        subTask: subTaskTranslation.translatedText,
        date: inventoryTask.date,
        time: inventoryTask.time,
        location: inventoryTask.location,
        employeeName: employeeNameTranslation.translatedText,
        inventoryImages: inventoryTask.inventoryImages,
        pumps: inventoryTask.pumps.map((pumpItem) => ({
          _id: pumpItem._id,
          pump:
            typeof pumpItem.pump?.pumpName === "object"
              ? pumpItem.pump.pumpName[targetLang] ||
                pumpItem.pump.pumpName.en ||
                Object.values(pumpItem.pump.pumpName)[0]
              : pumpItem.pump?.pumpName || null,
          pistols: pumpItem.pistols.map((pistolItem) => ({
            _id: pistolItem._id,
            pistol:
              typeof pistolItem.pistol?.gasolineName === "object"
                ? pistolItem.pistol.gasolineName[targetLang] ||
                  pistolItem.pistol.gasolineName.en ||
                  Object.values(pistolItem.pistol.gasolineName)[0]
                : pistolItem.pistol?.gasolineName || null,
            counterNumber: pistolItem.counterNumber,
          })),
        })),
        createdAt: inventoryTask.createdAt,
      },
    });
  }

  // 4. Not found in either collection
  return next(new Error("Task not found for this station", { cause: 404 }));
});
