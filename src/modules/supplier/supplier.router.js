import { Router } from "express";
import * as supplierController from "./controller/supplier.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  addSupplierSchema,
  headersSchema,
  reqIdSchema,
  reviewRequestSchema,
  sendToStationSchema,
  sendToSupplierSchema,
  supplierIdSchema,
  supplierRequestSchema,
  updateSupplierSchema,
} from "./controller/supplier.validation.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();
//add supplier
router.post(
  "/addSupplier",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  fileUpload(5, allowedTypesMap).single("supplierImage"),
  isValid(addSupplierSchema),
  supplierController.addSupplier
);

//update supplier
router.patch(
  "/updateSupplier/:supplierId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  fileUpload(5, allowedTypesMap).single("supplierImage"),
  isValid(updateSupplierSchema),
  supplierController.updateSupplier
);

//get all suppliers
router.get(
  "/getAllSuppliers",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageStations", "manageSuppliers"),
  supplierController.getAllSuppliers
);

//get sp supplier
router.get(
  "/getSpSupplier/:supplierId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(supplierIdSchema),
  supplierController.getSpSupplier
);

//delete supplier
router.delete(
  "/deleteSupplier/:supplierId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(supplierIdSchema),
  supplierController.deleteSupplier
);

//create supplier request
router.post(
  "/supplierRequest",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(supplierRequestSchema),
  supplierController.supplierRequest
);

//get all supplier requests
router.get(
  "/getALLSupplierReq",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  supplierController.getALLSupplierReq
);

//get sp supplier request
router.get(
  "/getSpReq/:reqId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(reqIdSchema),
  supplierController.getSpReq
);
//send to supplier
router.post(
  "/sendToSupplier",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(sendToSupplierSchema),
  supplierController.sendToSupplier
);
//send to station maneger
router.post(
  "/sendToStation",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(sendToStationSchema),
  supplierController.sendToStation
);
//get all station supplier requests
router.get(
  "/getStaSupplierReq",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.getStaSupplierReq
);

//review request
router.post(
  "/reviewRequest",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(10, allowedTypesMap).fields([
    { name: "carImage", maxCount: 1 },
    { name: "specsImage", maxCount: 1 },
    { name: "safetyImage", maxCount: 1 },
    { name: "receiptImage", maxCount: 1 },
  ]),
  isValid(reviewRequestSchema),
  supplierController.reviewRequest
);

//complete request
router.patch(
  "/completeReq/:reqId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(reqIdSchema),
  supplierController.completeReq
);
//delete supplier request
router.delete(
  "/deleteReq/:reqId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageSuppliers"),
  isValid(reqIdSchema),
  supplierController.deleteReq
);
export default router;
