import { Router } from "express";
import * as statisticsController from "./controller/statistics.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();
//tasks statistics
router.get("/taskstats", auth(["employee"]), statisticsController.taskstats);

//employees statistics
router.get(
  "/employeeStats",
  auth(["employee"]),
  statisticsController.employeeStats
);

//stations statistics
router.get(
  "/stationsStats",
  auth(["employee"]),
  statisticsController.stationsStats
);

//get Station Full Stats
router.get(
  "/getStationFullStats",
  auth(["employee"]),
  statisticsController.getStationFullStats
);

export default router;
