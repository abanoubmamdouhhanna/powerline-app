import { Router } from "express";
import * as stationController from "./controller/station.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { headersSchema } from "./controller/station.valdation.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";

const router = Router();

// add gasoline type
router.post(
  "/addGasoline",
  isValid(headersSchema, true),
  auth(["employee"]),
  stationController.addGasoline
);

// add pump
router.post(
  "/addPump",
  isValid(headersSchema, true),
  auth(["employee"]),
  stationController.addPump
);
//get pumps for station
router.get("/getPumps/:stationId", stationController.getPumps);

//get gasoline pump types
router.get(
  "/getPumpTypes",
  isValid(headersSchema, true),
  auth(["employee"]),
  stationController.getPumpTypes
);

//add station
router.post(
  "/addStation",
  flexibleDocumentUpload(5, 25),
  auth(["employee"]),
  stationController.addStation
);

//get all stations
router.get(
  "/getAllStations",
  auth(["employee"]),
  stationController.getAllStations
);

//get Sp station
router.get(
  "/getSpStation/:stationId",
  auth(["employee"]),
  stationController.getSpStation
);

//update station
router.patch(
  "/updateStation/:stationId",
  auth(["employee"]),
  stationController.updateStation
);

//delete station
router.delete(
  "/deleteStation/:stationId",
  auth(["employee"]),
  stationController.deleteStation
);

//delete specific document
router.delete(
  "/deleteDocument",
  auth(["employee"]),
  stationController.deleteDocument
);

// add new document
router.post(
  "/addStationDocument",
  flexibleDocumentUpload(5, 5),
  auth(["employee"]),
  stationController.addStationDocument
);
//delete store
router.delete(
  "/deleteStore",
  auth(["employee"]),
  stationController.deleteStore
);

// add new store
router.post(
  "/addStationStore",
  flexibleDocumentUpload(5, 5),
  auth(["employee"]),
  stationController.addStationStore
);

//add gasoline price
router.post("/addGasolinePrice",auth(["employee"]),
stationController.addGasolinePrice);

//update gasoline prices
router.patch("/updateGasolinePrice/:priceId",auth(["employee"]),
stationController.updateGasolinePrice);

//get gasoline prices
router.get("/getGasolinePrices/:stationId",auth(["employee"]),
stationController.getGasolinePrices);


export default router;
