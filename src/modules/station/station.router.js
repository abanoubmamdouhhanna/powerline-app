import { Router } from "express";
import * as stationController from "./controller/station.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  addGasolinePriceSchema,
  addPumpSchema,
  addStationSchema,
  addStationStoreSchema,
  deleteDocumentSchema,
  deleteStoreSchema,
  documentValidationSchema,
  gasolineTypeSchema,
  getPumpTypesSchema,
  headersSchema,
  stationIdSchema,
  updateGasolinePriceSchema,
  updateStationSchema,
} from "./controller/station.valdation.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();

// add gasoline type
router.post(
  "/addGasoline",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  isValid(gasolineTypeSchema),
  stationController.addGasoline
);

// add pump
router.post(
  "/addPump",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  isValid(addPumpSchema),
  stationController.addPump
);
//get pumps for station
router.get(
  "/getPumps/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  isValid(stationIdSchema),
  stationController.getPumps
);

//get gasoline pump types
router.get(
  "/getPumpTypes",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  isValid(getPumpTypesSchema),
  stationController.getPumpTypes
);

//add station
router.post(
  "/addStation",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  flexibleDocumentUpload(5, 25),
  isValid(addStationSchema),
  stationController.addStation
);

//get all stations
router.get(
  "/getAllStations",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  stationController.getAllStations
);

//get Sp station
router.get(
  "/getSpStation/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations", "manageEmployees"),
  isValid(stationIdSchema),
  stationController.getSpStation
);

//update station
router.patch(
  "/updateStation/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  isValid(updateStationSchema),
  stationController.updateStation
);

//delete station
router.delete(
  "/deleteStation/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  isValid(stationIdSchema),
  stationController.deleteStation
);

//delete specific document
router.delete(
  "/deleteDocument",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  isValid(deleteDocumentSchema),
  stationController.deleteDocument
);

// add new document
router.post(
  "/addStationDocument",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  flexibleDocumentUpload(5, 5),
  isValid(documentValidationSchema),
  stationController.addStationDocument
);
//delete store
router.delete(
  "/deleteStore",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  isValid(deleteStoreSchema),
  stationController.deleteStore
);

// add new store
router.post(
  "/addStationStore",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations"),
  flexibleDocumentUpload(5, 5),
  isValid(addStationStoreSchema),
  stationController.addStationStore
);

//add gasoline price
router.post(
  "/addGasolinePrice",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageGasolinePrices"),
  isValid(addGasolinePriceSchema),
  stationController.addGasolinePrice
);

//update gasoline prices
router.patch(
  "/updateGasolinePrice/:priceId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageGasolinePrices"),
  isValid(updateGasolinePriceSchema),
  stationController.updateGasolinePrice
);

//get gasoline prices
router.get(
  "/getGasolinePrices/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  isValid(stationIdSchema),
  stationController.getGasolinePrices
);

//get job tasks
router.get(
  "/getJobTasks/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageJobTasks", "manageEmployees", "manageStations"),
  isValid(stationIdSchema),
  stationController.getJobTasks
);

//station attendance
router.get(
  "/stationAttendance/:stationId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageAttendace", "manageEmployees", "manageStations"),
  isValid(stationIdSchema),
  stationController.stationAttendance
);

export default router;
