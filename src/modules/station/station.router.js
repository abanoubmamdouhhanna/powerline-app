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
//get pump
router.get("/getPumps/:stationId",
  stationController.getPumps
)

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
  stationController.addStation
);

//get all stations
router.get(
  "/getAllStations",
 stationController.getAllStations
);

//get Sp station
router.get(
  "/getSpStation/:stationId",
 stationController.getSpStation
);

//update station 
router.patch("/updateStation/:stationId",
  stationController.updateStation
)

export default router;
