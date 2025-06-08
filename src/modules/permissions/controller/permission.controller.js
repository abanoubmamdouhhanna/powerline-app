import permissionModel from "../../../../DB/models/Permission.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//create permission
export const createPermission = asyncHandler(async (req, res, next) => {
  const language = req.language || "en";
  const { name, permissions = {} } = req.body;

  // Translate name to all languages
  let permissionName;
  permissionName = await translateMultiLang(name);

  // Optional: Validate translation result
  if (
    !permissionName ||
    typeof permissionName !== "object" ||
    !permissionName.ar ||
    !permissionName.en ||
    !permissionName.bn
  ) {
    return next(
      new Error(
        "Permission name must include translations for ar, en, and bn",
        { cause: 400 }
      )
    );
  }

  // Check for duplicate permission name in any language
  const existingPermission = await permissionModel.findOne({
    $or: [
      { "permissionName.ar": permissionName.ar },
      { "permissionName.en": permissionName.en },
      { "permissionName.bn": permissionName.bn },
    ],
  });

  if (existingPermission) {
    return next(
      new Error("Permission with this name already exists", {
        cause: 409,
      })
    );
  }

  // Create new permission
  const newPermission = await permissionModel.create({
    permissionName: {
      ar: permissionName.ar.trim(),
      en: permissionName.en.trim(),
      bn: permissionName.bn.trim(),
    },
    permissions,
  });

  const formattedResponse = {
    _id: newPermission._id,
    permissionName:
      newPermission.permissionName[language] || newPermission.permissionName.en,
    permissions: newPermission.permissions,
    createdAt: newPermission.createdAt,
    updatedAt: newPermission.updatedAt,
  };

  return res.status(201).json({
    status: "success",
    message: getTranslation("Permission created successfully", language),
    result: formattedResponse,
  });
});

//====================================================================================================================//
//assign permission
export const assignPermissionToUsers = asyncHandler(async (req, res) => {
  const { userIds, permissionId } = req.body; // userIds is an array

  const permission = await permissionModel.findById(permissionId);
  if (!permission)
    return next(new Error("Permission not found", { cause: 404 }));

  const totalPermissions = Object.keys(permission.permissions).length;
  const selectedPermissions = Object.values(permission.permissions).filter(
    (v) => v
  ).length;

  const updatedUsers = [];

  for (const userId of userIds) {
    const user = await userModel.findById(userId);
    if (!user) continue;

    // Assign permission to user
    user.permissions = permission._id;

    // Set role dynamically
    if (selectedPermissions === totalPermissions) {
      user.role = "admin";
    } else if (selectedPermissions > 0) {
      user.role = "assistant";

      // Add user to assistant list if not already present
      if (!permission.assistant.includes(user._id)) {
        permission.assistant.push(user._id);
      }
    } else {
      user.role = "employee";
    }

    await user.save();
    updatedUsers.push(user);
  }

  await permission.save();

  res.status(200).json({
    message: getTranslation("Permissions assigned successfully", req.language),
  });
});
//====================================================================================================================//
//get permission
export const getAllPermissions = asyncHandler(async (req, res, next) => {
  const language = req.language || "en";

  const permissions = await permissionModel
    .find()
    .populate({ path: "assistant", select: "name" }); // get full name object

  const formattedPermissions = permissions.map((permission) => ({
    _id: permission._id,
    permissionName:
      permission.permissionName[language] || permission.permissionName.en,
    permissions: permission.permissions,
    assistant: permission.assistant.map(
      (user) => user.name[language] || user.name.en
    ), // localized names
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  }));

  res.status(200).json({
    status: "success",
    count: formattedPermissions.length,
    result: formattedPermissions,
  });
});

//====================================================================================================================//
//get permission by id
export const getPermissionById = asyncHandler(async (req, res, next) => {
  const language = req.language || "en";
  const { id } = req.params;

  const permission = await permissionModel
    .findById(id)
    .populate({ path: "assistant", select: "name" });

  if (!permission) {
    return next(
      new Error("Permission not found", {
        cause: 404,
      })
    );
  }

  // Safe mapping in case assistant is undefined or empty
  const assistants = Array.isArray(permission.assistant)
    ? permission.assistant.map((user) => user.name[language] || user.name.en)
    : [];

  res.status(200).json({
    status: "success",
    result: {
      _id: permission._id,
      permissionName:
        permission.permissionName[language] || permission.permissionName.en,
      permissions: permission.permissions,
      assistant: assistants,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    },
  });
});
//====================================================================================================================//
//update permission
export const updatePermission = asyncHandler(async (req, res, next) => {
  const language = req.language || "en";
  const { id } = req.params;
  const { name, permissions, assistantUserIds } = req.body;
  const permission = await permissionModel.findById(id).populate("assistant");
  if (!permission) {
    return next(new Error("Permission not found", { cause: 404 }));
  }

  // Update permissionName if name provided
  if (name) {
    const translatedName = await translateMultiLang(name);

    if (
      !translatedName ||
      typeof translatedName !== "object" ||
      !translatedName.ar ||
      !translatedName.en ||
      !translatedName.bn
    ) {
      return next(
        new Error(
          "Permission name must include translations for ar, en, and bn",
          { cause: 400 }
        )
      );
    }

    // Check duplicate name except current permission
    const existingPermission = await permissionModel.findOne({
      _id: { $ne: id },
      $or: [
        { "permissionName.ar": translatedName.ar },
        { "permissionName.en": translatedName.en },
        { "permissionName.bn": translatedName.bn },
      ],
    });
    if (existingPermission) {
      return next(
        new Error("Permission with this name already exists", {
          cause: 409,
        })
      );
    }

    permission.permissionName = {
      ar: translatedName.ar.trim(),
      en: translatedName.en.trim(),
      bn: translatedName.bn.trim(),
    };
  }

  // Update permissions if provided
  if (permissions && typeof permissions === "object") {
    permission.permissions = { ...permission.permissions, ...permissions };
  }

  if (Array.isArray(assistantUserIds)) {
    const oldAssistantIds = permission.assistant.map((user) =>
      user._id.toString()
    );
    const newAssistantIds = assistantUserIds.map(String);

    const addedUserIds = newAssistantIds.filter(
      (id) => !oldAssistantIds.includes(id)
    );
    const removedUserIds = oldAssistantIds.filter(
      (id) => !newAssistantIds.includes(id)
    );

    // Calculate total and selected permissions count
    const totalPermissions = Object.keys(permission.permissions).length;
    const selectedPermissions = Object.values(permission.permissions).filter(
      (v) => v
    ).length;

    // Assign permission and set role dynamically for newly added users
    for (const userId of addedUserIds) {
      const user = await userModel.findById(userId);
      if (!user) continue;

      user.permissions = permission._id;

      if (selectedPermissions === totalPermissions) {
        user.role = "admin";
      } else if (selectedPermissions > 0) {
        user.role = "assistant";

        if (!permission.assistant.includes(user._id)) {
          permission.assistant.push(user._id);
        }
      } else {
        user.role = "employee";
      }

      await user.save();
    }

    // Remove permission and reset role for users removed from assistants
    for (const userId of removedUserIds) {
      const user = await userModel.findById(userId);
      if (!user) continue;

      user.permissions = null;
      user.role = "employee";
      await user.save();
    }

    // Update permission.assistant list finally
    permission.assistant = assistantUserIds;
  }

  await permission.save();

  res.status(200).json({
    status: "success",
    message: getTranslation("Permission updated successfully", language),
    result: {
      _id: permission._id,
      permissionName:
        permission.permissionName[language] || permission.permissionName.en,
      permissions: permission.permissions,
      assistant: permission.assistant,
      updatedAt: permission.updatedAt,
    },
  });
});
//====================================================================================================================//
//delete permission
export const deletePermission = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const permission = await permissionModel.findById(id).populate("assistant");
  if (!permission) {
    return next(new Error("Permission not found", { cause: 404 }));
  }

  // Reset permissions and role for all assistant users
  for (const user of permission.assistant) {
    const existingUser = await userModel.findById(user._id);
    if (existingUser) {
      existingUser.permissions = null;
      existingUser.role = "employee";
      await existingUser.save();
    }
  }

  // Delete the permission
  await permissionModel.findByIdAndDelete(id);

  res.status(200).json({
    status: "success",
    message: getTranslation("Permission deleted successfully", req.language),
  });
});
