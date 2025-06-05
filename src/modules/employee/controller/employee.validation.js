import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

//=========================== GET LOCALIZED VALIDATION MESSAGE ================================//
const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== TIME FORMAT VALIDATION ================================//
// Valid format: "hh:mm AM/PM" (12-hour format with leading zero)
const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

//=========================== CHECK-IN SCHEMA ================================//
export const checkInSchema = (lang = "en") =>
  joi.object({
    checkIn: joi
      .string()
      .pattern(timeRegex)
      .required()
      .messages({
        "string.pattern.base": getMessage("TIME_FORMAT_INVALID", lang),
        "string.empty": getMessage("CHECK_IN_REQUIRED", lang),
        "any.required": getMessage("CHECK_IN_REQUIRED", lang),
      }),
    location: joi
      .object({
        type: joi.string().valid("Point").required().messages({
          "any.only": getMessage("LOCATION_TYPE_POINT_REQUIRED", lang),
          "any.required": getMessage("LOCATION_TYPE_REQUIRED", lang),
        }),
        coordinates: joi
          .array()
          .items(joi.number().required())
          .length(2)
          .required()
          .messages({
            "array.length": getMessage("COORDINATES_LENGTH_INVALID", lang),
            "array.includes": getMessage("COORDINATES_NUMBERS_ONLY", lang),
            "any.required": getMessage("COORDINATES_REQUIRED", lang),
          }),
      })
      .required()
      .messages({
        "object.base": getMessage("LOCATION_OBJECT_REQUIRED", lang),
        "any.required": getMessage("LOCATION_REQUIRED", lang),
      }),
  });

//=========================== CHECK-OUT SCHEMA ================================//
export const checkOutSchema = (lang = "en") =>
  joi.object({
    checkOut: joi
      .string()
      .pattern(timeRegex)
      .required()
      .messages({
        "string.pattern.base": getMessage("TIME_FORMAT_INVALID", lang),
        "string.empty": getMessage("CHECK_OUT_REQUIRED", lang),
        "any.required": getMessage("CHECK_OUT_REQUIRED", lang),
      }),
    location: joi
      .object({
        type: joi.string().valid("Point").required().messages({
          "any.only": getMessage("LOCATION_TYPE_POINT_REQUIRED", lang),
          "any.required": getMessage("LOCATION_TYPE_REQUIRED", lang),
        }),
        coordinates: joi
          .array()
          .items(joi.number().required())
          .length(2)
          .required()
          .messages({
            "array.length": getMessage("COORDINATES_LENGTH_INVALID", lang),
            "array.includes": getMessage("COORDINATES_NUMBERS_ONLY", lang),
            "any.required": getMessage("COORDINATES_REQUIRED", lang),
          }),
      })
      .required()
      .messages({
        "object.base": getMessage("LOCATION_OBJECT_REQUIRED", lang),
        "any.required": getMessage("LOCATION_REQUIRED", lang),
      }),
  });
