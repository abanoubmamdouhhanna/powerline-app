import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

export const headersSchema = (lang = "en") => generalFields(lang).headers;

export const createGroupsSchema = (lang = "en") =>
  joi
    .object({
      name: joi.string().required(),
      members: joi.array().items(generalFields(lang).id).required(),
    })
    .required();

export const getGroupMessagesSchema = (lang = "en") =>
  joi.object({ groupId: generalFields(lang).id }).required();
