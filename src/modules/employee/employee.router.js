import { Router } from "express";
import * as employeeController from "./controller/employee.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();
//checkIn
router.post("/checkIn", auth(["employee"]), employeeController.checkIn);
//checkOut
router.post("/checkOut", auth(["employee"]), employeeController.checkOut);
export default router;
