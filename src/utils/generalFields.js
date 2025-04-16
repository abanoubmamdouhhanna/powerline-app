import joi from "joi";
import { Types } from "mongoose";
import { ValidationErrors } from "../../languages/validationErrorTranslation.js";

// Validation Messages in English & Arabic

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

const checkObjectId = (value, helper, lang) => {
  if (!value || !Types.ObjectId.isValid(value)) {
    return helper.message(getMessage("Invalid ObjectId", lang));
  }
  return value;
};

export const generalFields = (lang = "en") => ({
  id: joi
    .string()
    .custom((value, helper) => checkObjectId(value, helper, lang))
    .required()
    .messages({
      "any.required": getMessage("Required Input", lang),
      "string.base": getMessage("Invalid ID Format", lang),
    }),

  optionalId: joi
    .string()
    .custom((value, helper) => checkObjectId(value, helper, lang))
    .optional(),

  name: joi
    .string()
    .trim()
    .min(3)
    .max(200)
    .messages({
      "any.required": getMessage("name Required", lang),
      "string.empty": getMessage("name Empty", lang),
      "string.base": getMessage("name String", lang),
      "string.min": getMessage("name Min", lang),
      "string.max": getMessage("name Max", lang),
    }),

  email: joi
    .string()
    .trim()
    .lowercase()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "org", "edu", "gov", "info"] },
    })
    .messages({
      "string.email": getMessage("email Invalid", lang),
      "string.empty": getMessage("email Empty", lang),
      "string.domain": getMessage("email Domain", lang),
    }),

  phone: joi
    .string()
    .trim()
    .pattern(/^(00966|\\+966|0)?5[0-9]{8}$/)
    .messages({
      "any.required": getMessage("phone Required", lang),
      "string.empty": getMessage("phone Invalid", lang),
      "string.pattern.base": getMessage("phone Invalid", lang),
    }),

  phoneOrEmail: joi
    .alternatives()
    .try(
      joi
        .string()
        .trim()
        .pattern(/^(00966|\\+966|0)?5[0-9]{8}$/)
        .messages({
          "string.pattern.base": getMessage("phone Invalid", lang),
        }),
      joi
        .string()
        .trim()
        .lowercase()
        .email({
          minDomainSegments: 2,
          tlds: { allow: ["com", "net", "org", "edu", "gov", "info"] },
        })
        .messages({
          "string.email": getMessage("email Invalid", lang),
          "string.empty": getMessage("email Empty", lang),
        })
    )
    .required()
    .messages({
      "any.required": getMessage("phone Or Email Required", lang),
    }),

  password: joi
    .string()
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .messages({
      "any.required": getMessage("password Required", lang),
      "string.empty": getMessage("password Empty", lang),
      "string.pattern.base": getMessage("password Pattern", lang),
    }),

  cPassword: joi
    .string()
    .valid(joi.ref("password"))
    .messages({
      "any.only": getMessage("confirm Password", lang),
      "any.required": getMessage("confirm Password", lang),
    }),

  otp: joi
    .string()
    .trim()
    .alphanum()
    .length(4)
    .messages({
      "any.required": getMessage("otp Required", lang),
      "string.empty": getMessage("otpI nvalid", lang),
      "string.length": getMessage("otp Invalid", lang),
      "string.alphanum": getMessage("otp Format", lang),
    }),

  file: joi
    .object({
      size: joi.number().positive().required(),
      path: joi.string().required(),
      filename: joi.string().required(),
      destination: joi.string().required(),
      mimetype: joi.string().required(),
      encoding: joi.string().required(),
      originalname: joi.string().required(),
      fieldname: joi.string().required(),
    })
    .messages({
      "any.required": getMessage("file Required", lang),
      "number.positive": getMessage("file Size Invalid", lang),
      "string.base": getMessage("file Type Invalid", lang),
    }),

  headers: joi.object({
    authorization: joi
      .string()
      .required()
      .regex(/^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/)
      .messages({
        "any.required": getMessage("auth Header Required", lang),
        "string.empty": getMessage("auth Header Required", lang),
        "string.pattern.base": getMessage("auth Header Invalid", lang),
      }),
  }),
});
