import userModel from "../../DB/models/User.model.js";
import { asyncHandler } from "../utils/errorHandling.js";

export const verifyPermissions = (...requiredPermissions) => {
  return asyncHandler(async (req, res, next) => {
    const user = await userModel.findById(req.user._id).populate("permissions");

    if (!user) {
      return next(new Error("User not found", { cause: 404 }));
    }

    if (user.role === "admin") {
      return next();
    }

    if (user.role !== "assistant" || !user.permissions) {
      return next(
        new Error("Access denied: Insufficient permissions", { cause: 403 })
      );
    }

    const userPermissions = user.permissions.permissions;

    const hasAllPermissions = requiredPermissions.every(
      (perm) => userPermissions[perm]
    );
    // Deny access if the user doesn't have the required permissions
    if (!hasAllPermissions) {
      return next(
        new Error("Access denied: Insufficient permissions", { cause: 403 })
      );
    }

    next();
  });
};
