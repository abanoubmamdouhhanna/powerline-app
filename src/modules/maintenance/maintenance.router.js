import { Router } from "express";
import * as maintenanceController from "./controller/maintenance.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";

const router = Router();
//create maintenance request
router.post(
  "/maintenanceRequest",
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "maintenanceImages", maxCount: 10 },
  ]),
  maintenanceController.maintenanceRequest
);

//update maintenance request
router.put(
  "/maintenanceRequest/:maintenanceId",
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "maintenanceImages", maxCount: 10 },
  ]),
  maintenanceController.updateMaintenanceRequest
);

//get all maintenance requests
router.get(
  "/maintenanceRequest",
  auth(["employee"]),
  maintenanceController.getAllMaintenanceRequests
);

//get maintenance request by id
router.get(
  "/maintenanceRequest/:maintenanceId",
  auth(["employee"]),
  maintenanceController.getMaintenanceRequestById
);

//delete maintenance request
router.delete(
  "/maintenanceRequest/:maintenanceId",
  auth(["employee"]),
  maintenanceController.deleteMaintenanceRequest
);

//update maintenance request status
router.patch(
  "/maintenanceRequest/:maintenanceId",
  auth(["employee"]),
  maintenanceController.updateMaintenanceRequestStatus
);

export default router;
