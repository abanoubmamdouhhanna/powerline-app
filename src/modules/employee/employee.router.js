import { Router } from "express";
import * as employeeController from "./controller/employee.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  checkInSchema,
  checkOutSchema,
  headersSchema,
} from "./controller/employee.validation.js";

const router = Router();
//checkIn
router.post(
  "/checkIn",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(checkInSchema),
  employeeController.checkIn
);
//checkOut
router.post(
  "/checkOut",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(checkOutSchema),
  employeeController.checkOut
);

//profile
router.get(
  "/profile",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  employeeController.profile
);
export default router;
