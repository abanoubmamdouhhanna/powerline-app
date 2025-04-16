import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import * as hrController from "./controller/hr.controller.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";
import {
  createEmployeeSchema,
  headersSchema,
  logInSchema,
} from "./controller/hr.validation.js";

const router = Router();

router.post(
  "/create", 
  flexibleDocumentUpload(5, 21), 
  isValid(createEmployeeSchema),
  hrController.createEmployee
);

//login
router.post("/login", isValid(logInSchema), hrController.logIn);

//log out
router.patch(
  "/logout",
  isValid(headersSchema, true),
  auth(["admin", "user", "assistant"]),
  hrController.logOut
);

export default router;
