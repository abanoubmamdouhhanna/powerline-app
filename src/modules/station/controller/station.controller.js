import { nanoid } from "nanoid";
import gasolineTypeModel from "../../../../DB/models/GasolineType.model.js";
import pumpModel from "../../../../DB/models/Pump.model.js";
import stationModel from "../../../../DB/models/Station.model.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { capitalizeWords } from "../../../utils/capitalize.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  uploadImageCloudinary,
  uploadToCloudinary,
} from "../../../utils/cloudinaryHelpers.js";

// add gasoline type
export const addGasoline = asyncHandler(async (req, res, next) => {
  const { gasolineName } = req.body;
  const gasoline = await gasolineTypeModel.create({ gasolineName });
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
        { cause: 404 }
      )
    );
  }
  // const isStationValid = await stationModel.exists({ _id: station });
  // if (!isStationValid) return next(new Error( "Station not found.", { cause: 404 }));

  const validGasolines = await gasolineTypeModel.find({
    _id: { $in: pistolTypes },
  });
  if (validGasolines.length !== pistolTypes.length) {
    return next(
      new Error("One or more pistol types are invalid.", { cause: 400 })
    );
  }
  const pump = await pumpModel.create({ station, pumpName, pistolTypes });
  return res.status(201).json({
    message: getTranslation("Pump created successfully.", req.language),
    result: pump,
  });
});

//====================================================================================================================//
//get gasoline types for pump
export const getPumpTypes = asyncHandler(async (req, res, next) => {
  const { pumpId, stationId } = req.body;

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
  return res.status(201).json({
    status: "success",
    result: pump,
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

  // 1. Format and ID
  const formattedStationName = capitalizeWords(stationName);
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
            title,
            start: new Date(start),
            end: new Date(end),
            files: fileUploads, // [{ secure_url, public_id, resource_type }, …]
          };
        })
      )
    : [];

  // 4. Process each store
  const processedStores = Array.isArray(storesData)
    ? await Promise.all(
        storesData.map(async (store, i) => {
          const {
            storeName,
            description,
            residenceExpiryDate, // ISO string
          } = store;

          if (!storeName || !description || !residenceExpiryDate) {
            throw new Error(
              "Each store must have storeName, description, and residenceExpiryDate"
            );
          }

          const baseFolder = `${process.env.APP_NAME}/Stations/${customId}/stores/store_${i}`;

          // 4a. leaseDoc (required)
          const leaseFiles = uploadedFiles[`leaseDoc_${i}`] || [];
          if (leaseFiles.length !== 1) {
            throw new Error("Each store must have exactly one leaseDoc file");
          }
          const leaseDoc = await uploadToCloudinary(
            leaseFiles[0],
            `${baseFolder}/leaseDoc`,
            `${customId}_storeLease_${i}_${leaseFiles[0].originalname}`
          );
          // leaseDoc → { secure_url, public_id, resource_type }

          // 4b. shopImage (optional)
          const shopImageFile = uploadedFiles[`shopImage_${i}`]?.[0] || null;
          const shopImage = shopImageFile
            ? await uploadImageCloudinary(
                shopImageFile,
                `${baseFolder}/shopImage`,
                `${customId}_storeImage`
              )
            : null;

          return {
            storeName,
            description,
            leaseDoc,
            shopImage, // string or null
            residenceExpiryDate: new Date(residenceExpiryDate),
          };
        })
      )
    : [];

  // 5. Create and respond
  const newStation = await stationModel.create({
    customId,
    stationName: formattedStationName,
    stationAddress,
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
  const stations = await stationModel
    .find({}, "stationName employees")
    .populate("stationEmployees", "name imageUrl permissions");
    const enrichedStations = stations.map((station) => ({
      ...station._doc,
      employeeCount: station.stationEmployees.length,
    }));
  return res.status(200).json({
    message: "SUccess",
    result: stations,
  });
});
