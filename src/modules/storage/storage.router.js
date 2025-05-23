import { Router } from "express";
import * as storageController from "./controller/storage.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowedTypesMap, fileUpload, flexibleDocumentUpload } from "../../utils/multerCloudinary.js";

const router = Router();
//create storage
router.post(
  "/createStorage",
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).single("storageImage"),
  storageController.createStorage
);

//get all storages
router.get(
  "/getAllStorages",
  auth(["employee"]),
  storageController.getAllStorages
);

//get storage by id
router.get(
  "/getStorageById/:storageId",
  auth(["employee"]),
  storageController.getStorageById
);

//update storage
router.patch(
  "/updateStorage/:storageId",
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).single("storageImage"),
  storageController.updateStorage
);

//delete storage
router.delete(
  "/deleteStorage/:storageId",
  auth(["employee"]),
  storageController.deleteStorage
);

export default router;
