import { Router } from "express";
import * as storageController from "./controller/storage.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  allowedTypesMap,
  fileUpload,
  flexibleDocumentUpload,
} from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  createStorageSchema,
  headersSchema,
  storageIdSchema,
  updateStorageSchema,
} from "./controller/storage.validation.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();
//create storage
router.post(
  "/createStorage",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageStorages"),
  fileUpload(5, allowedTypesMap).single("storageImage"),
  isValid(createStorageSchema),
  storageController.createStorage
);

//get all storages
router.get(
  "/getAllStorages",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageStorages"),
  storageController.getAllStorages
);

//get storage by id
router.get(
  "/getStorageById/:storageId",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageStorages"),
  isValid(storageIdSchema),
  storageController.getStorageById
);

//update storage
router.patch(
  "/updateStorage/:storageId",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageStorages"),
  fileUpload(5, allowedTypesMap).single("storageImage"),
  isValid(updateStorageSchema),
  storageController.updateStorage
);

//delete storage
router.delete(
  "/deleteStorage/:storageId",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageStorages"),
  isValid(storageIdSchema),
  storageController.deleteStorage
);

export default router;
