import { Router } from "express";
import * as employeeController from "./controller/employee.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();
//checkIn
router.post("/checkIn", auth(["employee"]), employeeController.checkIn);
//checkOut
router.post("/checkOut", auth(["employee"]), employeeController.checkOut);

//profile
router.get("/profile", auth(["employee"]), employeeController.profile)
export default router;
