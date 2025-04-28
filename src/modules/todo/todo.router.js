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

//get tasks
router.get("/getTasks", auth(["employee"]),todoController.getTasks)
export default router;

//change status
router.patch("/changeStatus", auth(["employee"]),todoController.changeStatus)