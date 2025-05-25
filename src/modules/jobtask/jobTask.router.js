import { Router } from "express";
import * as jobTaskController from "./controller/jobTask.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { headersSchema } from "./controller/jobTask.validation.js";

const router = Router();
//cleaning task
router.post(
  "/cleaningJobTask",

  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "cleaningImages", maxCount: 10 },
  ]),

  jobTaskController.cleaningJobTask
);

//inventory task
router.post(
  "/inventoryJobTask",

  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "inventoryImages", maxCount: 10 },
  ]),

  jobTaskController.inventoryJobTask
);
export default router;
