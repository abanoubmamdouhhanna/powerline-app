import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== MAINTENANCE REQUEST SCHEMA ================================//
export const maintenanceRequestSchema = (lang = "en") =>
  joi
    .object({
      employeeName: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
          "string.empty": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
          "string.base": getMessage("EMPLOYEE_NAME_INVALID", lang),
        }),

      description: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("DESCRIPTION_REQUIRED", lang),
          "string.empty": getMessage("DESCRIPTION_REQUIRED", lang),
          "string.base": getMessage("DESCRIPTION_INVALID", lang),
        }),

      file: joi
        .object({
          maintenanceImages: joi
            .array()
            .items(generalFields(lang).file)
            .min(1)
            .max(10)
            .messages({
              "array.base": getMessage("imagesInvalid", lang),
              "array.min": getMessage("imagesMin", lang),
              "array.max": getMessage("imagesMax", lang),
            }),
        })
        .required()
        .messages({
          "object.base": getMessage("fileObjectInvalid", lang),
        }),
    })
    .required();

//=========================== MAINTENANCE UPDATE SCHEMA ================================//
export const maintenanceUpdateSchema = (lang = "en") =>
  joi
    .object({
      maintenanceId: generalFields(lang).id,

      employeeName: joi
        .string()
        .trim()
        .optional()
        .empty("")
        .messages({
          "string.empty": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
          "string.base": getMessage("EMPLOYEE_NAME_INVALID", lang),
        }),

      description: joi
        .string()
        .trim()
        .optional()
        .empty("")
        .messages({
          "string.empty": getMessage("DESCRIPTION_REQUIRED", lang),
          "string.base": getMessage("DESCRIPTION_INVALID", lang),
        }),

      file: joi
        .object({
          maintenanceImages: joi
            .array()
            .items(generalFields(lang).file)
            .min(1)
            .max(10)
            .messages({
              "array.base": getMessage("imagesInvalid", lang),
              "array.min": getMessage("imagesMin", lang),
              "array.max": getMessage("imagesMax", lang),
            }),
        })
        .optional()
        .messages({
          "object.base": getMessage("fileObjectInvalid", lang),
        }),
    })
    .required();

//=========================== MAINTENANCE ID SCHEMA ================================//
export const maintenanceIdSchema = (lang = "en") =>
  joi
    .object({
      maintenanceId: generalFields(lang).id,
    })
    .required();
