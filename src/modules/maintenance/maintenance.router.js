import { Router } from "express";
import * as maintenanceController from "./controller/maintenance.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  headersSchema,
  maintenanceIdSchema,
  maintenanceRequestSchema,
  maintenanceUpdateSchema,
} from "./controller/maintenancevalidation.js";

const router = Router();
//create maintenance request
router.post(
  "/maintenanceRequest",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "maintenanceImages", maxCount: 10 },
  ]),
  isValid(maintenanceRequestSchema),
  maintenanceController.maintenanceRequest
);

//update maintenance request
router.put(
  "/maintenanceRequest/:maintenanceId",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "maintenanceImages", maxCount: 10 },
  ]),
  isValid(maintenanceUpdateSchema),
  maintenanceController.updateMaintenanceRequest
);

//get all maintenance requests
router.get(
  "/maintenanceRequest",
  isValid(headersSchema, true),
  auth(["employee"]),
  maintenanceController.getAllMaintenanceRequests
);

//get maintenance request by id
router.get(
  "/maintenanceRequest/:maintenanceId",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(maintenanceIdSchema),
  maintenanceController.getMaintenanceRequestById
);
//get maintenance by stationId
router.get(
  "/maintenanceByStationId",
  isValid(headersSchema, true),
  auth(["employee"]),
  maintenanceController.getMaintenanceRequestByStationId
);

//delete maintenance request
router.delete(
  "/maintenanceRequest/:maintenanceId",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(maintenanceIdSchema),
  maintenanceController.deleteMaintenanceRequest
);

//update maintenance request status
router.patch(
  "/maintenanceRequest/:maintenanceId",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(maintenanceIdSchema),
  maintenanceController.updateMaintenanceRequestStatus
);

export default router;
