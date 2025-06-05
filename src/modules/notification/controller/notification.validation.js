import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

export const headersSchema = (lang = "en") => generalFields(lang).headers;
//=============================== CREATE NOTIFICATION ============================//
export const createNotificationSchema = (lang = "en") =>
  joi.object({
    employeeId: generalFields(lang).id,
    message: joi
      .string()
      .trim()
      .required()
      .messages({
        "any.required": getMessage("MESSAGE_REQUIRED", lang),
        "string.empty": getMessage("MESSAGE_REQUIRED", lang),
        "string.base": getMessage("MESSAGE_INVALID", lang),
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
  });
//=========================== PERMISSION ID ONLY ================================//
export const notificationId = (lang = "en") =>
  joi.object({
    id: generalFields(lang).id,
  });
