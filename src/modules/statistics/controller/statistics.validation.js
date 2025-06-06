import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS VALIDATION SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;
