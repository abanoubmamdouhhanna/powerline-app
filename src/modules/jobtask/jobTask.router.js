import { Router } from "express";
import * as jobTaskController from "./controller/jobTask.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { cleaningJobTaskSchema, headersSchema, inventoryJobTaskSchema } from "./controller/jobTask.validation.js";

const router = Router();
//cleaning task
router.post(
  "/cleaningJobTask",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "cleaningImages", maxCount: 10 },
  ]),
isValid(cleaningJobTaskSchema),
  jobTaskController.cleaningJobTask
);

//inventory task
router.post(
  "/inventoryJobTask",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "inventoryImages", maxCount: 10 },
  ]),
isValid(inventoryJobTaskSchema),
  jobTaskController.inventoryJobTask
);
export default router;
