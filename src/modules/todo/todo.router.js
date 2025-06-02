import { Router } from "express";
import * as todoController from "./controller/todo.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { flexibleDocumentUpload } from "../../utils/multerCloudinary.js";

const router = Router();
//create task
router.post(
  "/createTask",
  flexibleDocumentUpload(5, 15),
  auth(["employee"]),
  todoController.createTask
);

//get tasks for user
router.get("/getAllTasks", auth(["employee"]), todoController.getTasks);

//get tasks for user by admin
router.get("/getTaskbyId/:userId", auth(["employee"]), todoController.getTaskbyId);

//change status
router.patch("/changeStatus", auth(["employee"]), todoController.changeStatus);

//get all tasks for admin
router.get("/allTasks", auth(["assistant" ,"employee"]), todoController.getAllTasks);

//update task
router.patch(
  "/updateTask/:taskId",
  auth(["employee"]),
  todoController.updateTask
);

//delete task
router.delete(
  "/deleteTask/:taskId",
  auth(["employee"]),
  todoController.deleteTask
);

//delete task document
router.delete(
  "/deleteTaskDocument",
  auth(["employee"]),
  todoController.deleteTaskDocument
);

//add task document
router.post(
  "/addTaskDocument",
  flexibleDocumentUpload(5, 5),
  auth(["employee"]),
  todoController.addTaskDocument
);
export default router;
