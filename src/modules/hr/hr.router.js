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
   auth(["employee"]),
  isValid(createEmployeeSchema),
  hrController.createEmployee
);

//login
router.post("/login", auth(["employee"]), isValid(logInSchema), hrController.logIn);

//log out
router.patch(
  "/logout",
  isValid(headersSchema, true),
  auth(["admin", "employee", "assistant"]),
  hrController.logOut
);
// update employee
router.patch(
  "/updateEmployee/:employeeId",
  flexibleDocumentUpload(5, 1),
   auth(["employee"]),
  isValid(updateEmployeeSchema),
  hrController.updateEmployee
);
// delete employee
router.delete("/deleteEmployee/:employeeId", auth(["employee"]), hrController.deleteEmployee);

//delete specific document
router.delete("/deleteDocument", auth(["employee"]), hrController.deleteDocument);

// add new document
router.post(
  "/addUserDocument",
  flexibleDocumentUpload(5, 5),
   auth(["employee"]),
  hrController.addUserDocument
);

//get all employees
router.get(
  "/getAllEmployees",
   auth(["employee"]),
  hrController.getAllEmployees
);

//user attendance
router.get(
  "/userAttendance",
   auth(["employee"]),
  hrController.userAttendance
);

//get job tasks
router.get(
  "/getJobTasks/:userId",
  auth(["employee"]),
  hrController.getJobTasks
);

export default router;
