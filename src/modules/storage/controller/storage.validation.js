import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS VALIDATION SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;
//=========================== CREATE STORAGE VALIDATION SCHEMA =========================//
export const createStorageSchema = (lang = "en") =>
  joi
    .object({
      storageName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STORAGE_NAME_INVALID", lang),
          "string.empty": getMessage("STORAGE_NAME_REQUIRED", lang),
          "any.required": getMessage("STORAGE_NAME_REQUIRED", lang),
        }),

      description: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STORAGE_DESCRIPTION_INVALID", lang),
          "string.empty": getMessage("STORAGE_DESCRIPTION_REQUIRED", lang),
          "any.required": getMessage("STORAGE_DESCRIPTION_REQUIRED", lang),
        }),

      station: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("STATION_ID_INVALID", lang),
          "string.empty": getMessage("STATION_ID_REQUIRED", lang),
          "any.required": getMessage("STATION_ID_REQUIRED", lang),
        }),

      remainingNo: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("REMAINING_NO_INVALID", lang),
          "number.min": getMessage("REMAINING_NO_MIN", lang),
          "any.required": getMessage("REMAINING_NO_REQUIRED", lang),
        }),

      file: generalFields(lang)
        .file.required()
        .messages({
          "any.required": getMessage("STORAGE_IMAGE_REQUIRED", lang),
          "string.base": getMessage("STORAGE_IMAGE_INVALID", lang),
        }),
    })
    .required();

//=========================== STORAGE ID VALIDATION SCHEMA ============================//
export const storageIdSchema = (lang = "en") =>
  joi
    .object({
      storageId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("STORAGE_ID_INVALID", lang),
          "string.empty": getMessage("STORAGE_ID_REQUIRED", lang),
          "any.required": getMessage("STORAGE_ID_REQUIRED", lang),
        }),
    })
    .required();

//=========================== UPDATE STORAGE VALIDATION SCHEMA ========================//
export const updateStorageSchema = (lang = "en") =>
  joi
    .object({
      storageId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("STORAGE_ID_INVALID", lang),
          "string.empty": getMessage("STORAGE_ID_REQUIRED", lang),
          "any.required": getMessage("STORAGE_ID_REQUIRED", lang),
        }),

      storageName: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("STORAGE_NAME_INVALID", lang),
          "string.empty": getMessage("STORAGE_NAME_REQUIRED", lang),
        }),

      description: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("STORAGE_DESCRIPTION_INVALID", lang),
          "string.empty": getMessage("STORAGE_DESCRIPTION_REQUIRED", lang),
        }),

      station: generalFields(lang).optionalId.messages({
        "string.base": getMessage("STATION_ID_INVALID", lang),
        "string.empty": getMessage("STATION_ID_REQUIRED", lang),
      }),

      remainingNo: joi
        .number()
        .min(0)
        .optional()
        .messages({
          "number.base": getMessage("REMAINING_NO_INVALID", lang),
          "number.min": getMessage("REMAINING_NO_MIN", lang),
        }),

      file: generalFields(lang)
        .file.optional()
        .messages({
          "string.base": getMessage("STORAGE_IMAGE_INVALID", lang),
        }),
    })
    .required();
