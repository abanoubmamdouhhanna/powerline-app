import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import * as hrController from "./controller/hr.controller.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";
import {
  createEmployeeSchema,
  headersSchema,
  logInSchema,
  updateEmployeeSchema,
} from "./controller/hr.validation.js";

const router = Router();

//create employee
router.post(
  "/createEmployee",
  flexibleDocumentUpload(5, 25),
  // isValid(createEmployeeSchema),
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
// update employee
router.patch(
  "/updateEmployee/:employeeId",
  flexibleDocumentUpload(5, 1),
  isValid(updateEmployeeSchema),
  hrController.updateEmployee
);
// delete employee
router.delete("/deleteEmployee/:employeeId", hrController.deleteEmployee);

//delete specific document
router.delete("/deleteDocument", hrController.deleteDocument);

// add new document
router.post(
  "/addUserDocument",
  flexibleDocumentUpload(5, 5),
  hrController.addUserDocument
);

//get all employees
router.get(
  "/getAllEmployees",
  hrController.getAllEmployees
);

//user attendance
router.get(
  "/userAttendance",
  hrController.userAttendance
);

//get job tasks
router.get(
  "/getJobTasks/:userId",
  hrController.getJobTasks
);

export default router;
