import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import * as hrController from "./controller/hr.controller.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";
import {
  createEmployeeSchema,
  deleteDocumentSchema,
  documentValidationSchema,
  headersSchema,
  idEmployeeSchema,
  logInSchema,
  updateEmployeeSchema,
} from "./controller/hr.validation.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();

//create employee
router.post(
  "/createEmployee",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageEmployees"),
  flexibleDocumentUpload(5, 25),
  isValid(createEmployeeSchema),
  hrController.createEmployee
);

//login
router.post("/login", isValid(logInSchema), hrController.logIn);

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
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageEmployees"),
  flexibleDocumentUpload(5, 1),
  isValid(updateEmployeeSchema),
  hrController.updateEmployee
);
// delete employee
router.delete(
  "/deleteEmployee/:employeeId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageEmployees"),
  isValid(idEmployeeSchema),
  hrController.deleteEmployee
);

//delete specific document
router.delete(
  "/deleteDocument",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageEmployees"),
  isValid(deleteDocumentSchema),
  hrController.deleteDocument
);

// add new document
router.post(
  "/addUserDocument",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageEmployees"),
  flexibleDocumentUpload(5, 5),
  isValid(documentValidationSchema),
  hrController.addUserDocument
);

//get all employees
router.get(
  "/getAllEmployees",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions(
    "manageTODO",
    "manageEmployees",
    "manageChats",
    "managePushNotifications",
    "managePermissions"
  ),
  hrController.getAllEmployees
);
//get specific employee
router.get(
  "/getSpecificEmployee/:employeeId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageEmployees"),
  isValid(idEmployeeSchema),
  hrController.getSpecificEmployee
);
//user attendance
router.get(
  "/userAttendance/:employeeId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageAttendace", "manageEmployees"),
  isValid(idEmployeeSchema),
  hrController.userAttendance
);

//get job tasks
router.get(
  "/getJobTasks/:employeeId",
  isValid(headersSchema, true),
  auth(["admin", "assistant"]),
  verifyPermissions("manageJobTasks", "manageEmployees"),
  isValid(idEmployeeSchema),
  hrController.getJobTasks
);

export default router;
