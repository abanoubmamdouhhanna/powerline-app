import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== GET MESSAGES SCHEMA ================================//
export const getMessagesSchema = (lang = "en") =>
  joi
    .object({
      userId: generalFields(lang).id.required().messages({
        "any.required": getMessage("USER_ID_REQUIRED", lang),
        "string.empty": getMessage("USER_ID_REQUIRED", lang),
        "string.base": getMessage("USER_ID_INVALID", lang),
      }),
    })
    .required();

//=========================== MESSAGE FILE SCHEMA ================================//
export const messageFileSchema = (lang = "en") =>
  joi
    .object({
      file: generalFields(lang).file.required().messages({
        "any.required": getMessage("FILE_REQUIRED", lang),
        "object.base": getMessage("FILE_INVALID", lang),
      }),
    })
    .required();
