import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== CLEANING JOB TASK SCHEMA ================================//
export const cleaningJobTaskSchema = (lang = "en") =>
  joi
    .object({
      employeeName: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
          "string.base": getMessage("EMPLOYEE_NAME_INVALID", lang),
        }),

      location: joi.any().required(),

      subTask: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("SUB_TASK_REQUIRED", lang),
          "string.base": getMessage("SUB_TASK_INVALID", lang),
        }),

      file: generalFields(lang).file,
    })
    .required();

//=========================== PISTOL SCHEMA ================================//
// 🔹 joi schema for each pistol
const pistolSchema = (lang) =>
  joi.object({
    pistol: generalFields(lang).id,

    counterNumber: joi
      .number()
      .min(0)
      .required()
      .messages({
        "number.base": getMessage("COUNTER_NUMBER_INVALID", lang),
        "number.min": getMessage("COUNTER_NUMBER_MIN", lang),
        "any.required": getMessage("COUNTER_NUMBER_REQUIRED", lang),
      }),
  });

//=========================== PUMP SCHEMA ================================//
// 🔹 joi schema for each pump
const pumpSchema = (lang) =>
  joi.object({
    pump: generalFields(lang).id,

    pistols: joi
      .array()
      .items(pistolSchema(lang))
      .min(1)
      .required()
      .messages({
        "array.base": getMessage("PISTOLS_ARRAY_INVALID", lang),
        "array.min": getMessage("AT_LEAST_ONE_PISTOL_REQUIRED", lang),
        "any.required": getMessage("PISTOLS_REQUIRED", lang),
      }),
  });

//=========================== INVENTORY JOB TASK SCHEMA ================================//
export const inventoryJobTaskSchema = (lang = "en") =>
  joi
    .object({
      employeeName: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
        }),

      location: joi
        .string()
        .required()
        .messages({
          "any.required": getMessage("LOCATION_REQUIRED", lang),
          "string.base": getMessage("LOCATION_MUST_BE_STRING", lang),
        }),

      pumps: joi
        .string()
        .required()
        .messages({
          "any.required": getMessage("PUMPS_REQUIRED", lang),
          "string.base": getMessage("PUMPS_MUST_BE_STRING", lang),
        }),

      file: generalFields(lang).file,
    })
    .required();
