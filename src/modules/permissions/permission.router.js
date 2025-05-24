import { Router } from "express";
import * as permissionController from "./controller/permission.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();
//create permission
router.post(
  "/createPermission",
  auth(["employee"]),
  permissionController.createPermission
);

//assign permission
router.post(
  "/assignPermissionToUsers",
  permissionController.assignPermissionToUsers
);

//get all permissions
router.get("/getAllPermissions", permissionController.getAllPermissions);

//get permission by id
router.get("/getPermissionById/:id", permissionController.getPermissionById);
//update permission
router.patch("/updatePermission/:id", permissionController.updatePermission);

//delete permission
router.delete("/deletePermission/:id", permissionController.deletePermission);

export default router;
