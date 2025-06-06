import { Router } from "express";
import * as permissionController from "./controller/permission.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  assignPermissionSchema,
  createPermissionSchema,
  headersSchema,
  permissionIdSchema,
  updatePermissionSchema,
} from "./controller/permissions.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { verifyPermissions } from "../../middlewares/verifyPermission.js";

const router = Router();
//create permission
router.post(
  "/createPermission",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePermissions"),
  isValid(createPermissionSchema),
  permissionController.createPermission
);

//assign permission
router.post(
  "/assignPermissionToUsers",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePermissions"),
  isValid(assignPermissionSchema),
  permissionController.assignPermissionToUsers
);

//get all permissions
router.get(
  "/getAllPermissions",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePermissions"),
  permissionController.getAllPermissions
);

//get permission by id
router.get(
  "/getPermissionById/:id",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePermissions"),
  isValid(permissionIdSchema),
  permissionController.getPermissionById
);
//update permission
router.patch(
  "/updatePermission/:id",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePermissions"),
  isValid(updatePermissionSchema),
  permissionController.updatePermission
);

//delete permission
router.delete(
  "/deletePermission/:id",
  isValid(headersSchema, true),
  auth(["admin","assistant"]),
  verifyPermissions("managePermissions"),
  isValid(permissionIdSchema),
  permissionController.deletePermission
);

export default router;
