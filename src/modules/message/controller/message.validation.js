import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";


const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

export const headersSchema = (lang = "en") => generalFields(lang).headers;


export const getMessagesSchema = (lang = "en") => joi
  .object({
    userId:generalFields(lang).id
   
  })
  .required();

  export const messageFileSchema = (lang = "en") => joi
  .object({
    file:generalFields(lang).file
   
  })
  .required();

