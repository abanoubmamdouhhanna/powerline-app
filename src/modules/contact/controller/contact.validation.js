import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";


const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

export const headersSchema = (lang = "en") => generalFields(lang).headers;

export const searchContactsSchema = joi
  .object({
    searchTerm:joi.string().required()
   
  })
  .required();

