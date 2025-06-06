import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") =>
  ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;

export const headersSchema = (lang = "en") => generalFields(lang).headers;

const validPermissionKeys = [
  "manageComplaints",
  "monitorRegisteredAccounts",
  "editAccountInformation",
  "trackServiceRequests",
  "manageProfessionsTrades",
  "manageCitiesRegions",
];

//=========================== CREATE PERMISSION ================================//
export const createPermissionSchema = (lang = "en") =>
  joi.object({
    name: joi.string().trim().required().messages({
      "string.base": getMessage("name_must_be_string", lang),
      "string.empty": getMessage("name_is_required", lang),
      "any.required": getMessage("name_is_required", lang),
    }),
    permissions: joi
      .object()
      .pattern(joi.string().valid(...validPermissionKeys), joi.boolean())
      .required()
      .messages({
        "object.base": getMessage("permissions_must_be_object", lang),
        "any.required": getMessage("permissions_is_required", lang),
        "object.unknown": getMessage("invalid_permission_type", lang),
      }),
  });

//=========================== ASSIGN PERMISSION ================================//
export const assignPermissionSchema = (lang = "en") =>
  joi.object({
    userIds: joi.array().items(generalFields(lang).id).min(1).required().messages({
      "array.base": getMessage("userIds_must_be_array", lang),
      "array.min": getMessage("userIds_is_required", lang),
      "any.required": getMessage("userIds_is_required", lang),
    }),
    permissionId: generalFields(lang).id.required().messages({
      "any.required": getMessage("permissionId_is_required", lang),
    }),
  });

//=========================== UPDATE PERMISSION ================================//
export const updatePermissionSchema = (lang = "en") =>
  joi.object({
    id: generalFields(lang).id.required().messages({
      "any.required": getMessage("id_is_required", lang),
    }),
    name: joi.string().trim().optional().messages({
      "string.base": getMessage("name_must_be_string", lang),
      "string.empty": getMessage("name_is_required", lang),
    }),
    permissions: joi
      .object()
      .pattern(joi.string().valid(...validPermissionKeys), joi.boolean())
      .optional()
      .messages({
        "object.base": getMessage("permissions_must_be_object", lang),
        "object.unknown": getMessage("invalid_permission_type", lang),
      }),
    assistantUserIds: joi
      .array()
      .items(generalFields(lang).id)
      .optional()
      .messages({
        "array.base": getMessage("userIds_must_be_array", lang),
        "array.empty": getMessage("userIds_is_required", lang),
      }),
  });

//=========================== PERMISSION ID ONLY ================================//
export const permissionIdSchema = (lang = "en") =>
  joi.object({
    id: generalFields(lang).id.required().messages({
      "any.required": getMessage("id_is_required", lang),
    }),
  });
