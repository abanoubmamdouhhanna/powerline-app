import gasolineTypeModel from "../../../../DB/models/GasolineType.model.js";
import pumpModel from "../../../../DB/models/Pump.model.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

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
  const { pumpId ,stationId } = req.body;

  const isPumpValid = await pumpModel.exists({ _id: pumpId,station:stationId });
  if (!isPumpValid) return next(new Error( "Pump not found.", { cause: 404 }));

  const pump = await pumpModel
    .findOne({ _id: pumpId,station:stationId }, "pistolTypes")
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

