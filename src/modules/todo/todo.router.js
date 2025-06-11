import { Router } from "express";
import * as todoController from "./controller/todo.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";
import {
  addTaskDocumentSchema,
  changeStatusSchema,
  createTaskSchema,
  deleteTaskSchema,
  getTaskbyUserIDSchema,
  headersSchema,
  updateTaskSchema,
} from "./controller/todo.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();
//create task
router.post(
  "/createTask",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO"),
  flexibleDocumentUpload(5, 15),
  isValid(createTaskSchema),
  todoController.createTask
);

//get tasks for user
router.get(
  "/getAllTasks",
  isValid(headersSchema, true),
  auth(["employee"]),
  todoController.getTasks
);

//get tasks for user by admin
router.get(
  "/getTaskbyId/:userId",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO","manageEmployees"),
  isValid(getTaskbyUserIDSchema),
  todoController.getTaskbyId
);

//change status
router.patch(
  "/changeStatus",
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(changeStatusSchema),
  todoController.changeStatus
);

//get all tasks for admin
router.get(
  "/allTasks",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO"),
  todoController.getAllTasks
);

//update task
router.patch(
  "/updateTask/:taskId",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO"),
  isValid(updateTaskSchema),
  todoController.updateTask
);

//delete task
router.delete(
  "/deleteTask/:taskId",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO"),
  isValid(deleteTaskSchema),
  todoController.deleteTask
);

//delete task document
router.delete(
  "/deleteTaskDocument",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO"),
  todoController.deleteTaskDocument
);

//add task document
router.post(
  "/addTaskDocument",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("manageTODO"),
  flexibleDocumentUpload(5, 5),
  isValid(addTaskDocumentSchema),
  todoController.addTaskDocument
);
export default router;
