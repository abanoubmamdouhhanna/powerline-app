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

export default router;
