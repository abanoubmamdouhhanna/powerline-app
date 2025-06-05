import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") =>
  ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;

export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== SEARCH CONTACTS SCHEMA ================================//
export const searchContactsSchema = (lang = "en") =>
  joi
    .object({
      searchTerm: joi
        .string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
          "string.base": getMessage("SEARCH_TERM_INVALID", lang),
          "string.empty": getMessage("SEARCH_TERM_REQUIRED", lang),
          "string.min": getMessage("SEARCH_TERM_TOO_SHORT", lang),
          "string.max": getMessage("SEARCH_TERM_TOO_LONG", lang),
          "any.required": getMessage("SEARCH_TERM_REQUIRED", lang),
        }),
    })
    .required();
