import { Router } from "express";
import * as statisticsController from "./controller/statistics.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { headersSchema } from "./controller/statistics.validation.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();
//tasks statistics
router.get(
  "/taskstats",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageViewStats"),
  statisticsController.taskstats
);

//employees statistics
router.get(
  "/employeeStats",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageViewStats"),
  statisticsController.employeeStats
);

//stations statistics
router.get(
  "/stationsStats",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageViewStats"),
  statisticsController.stationsStats
);
//overview statistics
router.get(
  "/overviewStats",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageViewStats"),
  statisticsController.overviewStats
);

//get Station Full Stats
router.get(
  "/getStationFullStats",
  isValid(headersSchema, true),
  auth(["employee"]),
  statisticsController.getStationFullStats
);

export default router;
