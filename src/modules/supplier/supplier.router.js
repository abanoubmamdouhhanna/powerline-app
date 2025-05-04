import { Router } from "express";
import * as supplierController from "./controller/supplier.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { headersSchema } from "./controller/supplier.validation.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";

const router = Router();
//add supplier
router.post(
  "/addSupplier",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).single("supplierImage"),
  supplierController.addSupplier
);

//update supplier
router.patch(
  "/updateSupplier/:supplierId",
  isValid(headersSchema, true),
  auth(["employee"]),
  fileUpload(5, allowedTypesMap).single("supplierImage"),
  supplierController.updateSupplier
);

//get all suppliers
router.get(
  "/getAllSuppliers",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.getAllSuppliers
);

//get supplier
router.get(
  "/getSpSupplier/:supplierId",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.getSpSupplier
);

//delete supplier
router.delete(
  "/deleteSupplier/:supplierId",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.deleteSupplier
);

//create supplier request
router.post(
  "/supplierRequest",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.supplierRequest
);

//get all supplier requests
router.get(
  "/getALLSupplierReq",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.getALLSupplierReq
);

//send to supplier
router.post(
  "/sendToSupplier",
  isValid(headersSchema, true),
  auth(["employee"]),
  supplierController.sendToSupplier
);
//send to station maneger
router.patch(
  "/sendToStation",
  isValid(headersSchema, true),
  auth(["employee"]),
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
  supplierController.reviewRequest
);
export default router;
