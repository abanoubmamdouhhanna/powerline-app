import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

//=========================== GET LOCALIZED VALIDATION MESSAGE ================================//
const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== CREATE GROUP SCHEMA ================================//
export const createGroupsSchema = (lang = "en") =>
  joi
    .object({
      name: joi.string().required().messages({
        "string.base": getMessage("GROUP_NAME_MUST_BE_STRING", lang),
        "string.empty": getMessage("GROUP_NAME_REQUIRED", lang),
        "any.required": getMessage("GROUP_NAME_REQUIRED", lang),
      }),
      members: joi
        .array()
        .items(generalFields(lang).id)
        .required()
        .messages({
          "array.base": getMessage("MEMBERS_MUST_BE_ARRAY", lang),
          "array.includes": getMessage("MEMBER_ID_INVALID", lang),
          "any.required": getMessage("MEMBERS_REQUIRED", lang),
        }),
    })
    .required();

//=========================== GET GROUP MESSAGES SCHEMA ================================//
export const getGroupMessagesSchema = (lang = "en") =>
  joi
    .object({
      groupId: generalFields(lang).id,
    })
    .required();
