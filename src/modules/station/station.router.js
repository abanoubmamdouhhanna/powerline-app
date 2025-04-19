import { Router } from "express";
import * as stationController from "./controller/station.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { headersSchema } from "./controller/station.valdation.js";

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

//get gasoline pump types
router.get(
  "/getPumpTypes",
  isValid(headersSchema, true),
  auth(["employee"]),
 stationController.getPumpTypes
);
export default router;
