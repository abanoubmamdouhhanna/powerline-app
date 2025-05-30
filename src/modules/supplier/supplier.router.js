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

  auth(["employee"]),
  fileUpload(5, allowedTypesMap).single("supplierImage"),
  supplierController.addSupplier
);

//update supplier
router.patch(
  "/updateSupplier/:supplierId",

  auth(["employee"]),
  fileUpload(5, allowedTypesMap).single("supplierImage"),
  supplierController.updateSupplier
);

//get all suppliers
router.get(
  "/getAllSuppliers",

  auth(["employee"]),
  supplierController.getAllSuppliers
);

//get sp supplier
router.get(
  "/getSpSupplier/:supplierId",

  auth(["employee"]),
  supplierController.getSpSupplier
);

//delete supplier
router.delete(
  "/deleteSupplier/:supplierId",

  auth(["employee"]),
  supplierController.deleteSupplier
);

//create supplier request
router.post(
  "/supplierRequest",

  auth(["employee"]),
  supplierController.supplierRequest
);

//get all supplier requests
router.get("/getALLSupplierReq", supplierController.getALLSupplierReq);

//get sp supplier request
router.get(
  "/getSpReq/:reqId",

  auth(["employee"]),
  supplierController.getSpReq
);
//send to supplier
router.post(
  "/sendToSupplier",

  auth(["employee"]),
  supplierController.sendToSupplier
);
//send to station maneger
router.post(
  "/sendToStation",

  auth(["employee"]),
  supplierController.sendToStation
);
//get all station supplier requests
router.get(
  "/getStaSupplierReq",

  auth(["employee"]),
  supplierController.getStaSupplierReq
);

//review request
router.post(
  "/reviewRequest",

  auth(["employee"]),
  fileUpload(10, allowedTypesMap).fields([
    { name: "carImage", maxCount: 1 },
    { name: "specsImage", maxCount: 1 },
    { name: "safetyImage", maxCount: 1 },
    { name: "receiptImage", maxCount: 1 },
  ]),
  supplierController.reviewRequest
);

//complete request
router.patch(
  "/completeReq/:reqId",

  auth(["employee"]),
  supplierController.completeReq
);
//delete supplier request
router.delete(
  "/deleteReq/:reqId",

  auth(["employee"]),
  supplierController.deleteReq
);
export default router;
