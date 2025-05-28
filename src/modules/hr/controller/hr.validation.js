import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

export const headersSchema = (lang = "en") => generalFields(lang).headers;
//====================================================================================================================//
function generateDocumentValidationSchema(lang) {
  return joi
    .array()
    .max(20)
    .items(
      joi
        .object({
          title: joi.string().messages({
            "string.base": getMessage("DOCUMENT_TITLE_STRING", lang),
            "string.empty": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
          }),
          start: joi.date().messages({
            "date.base": getMessage("DOCUMENT_START_DATE_INVALID", lang),
          }),
          end: joi.date().messages({
            "date.base": getMessage("DOCUMENT_END_DATE_INVALID", lang),
          }),
        })
        .required()
    )
    .messages({
      "array.base": getMessage("DOCUMENTS_ARRAY", lang),
      "array.max": getMessage("DOCUMENTS_MAX_LIMIT", lang),
    });
}
//====================================================================================================================//
export const createEmployeeSchema = (lang = "en") =>
  joi
    .object({
      name: generalFields(lang).name.required().trim(),

      email: generalFields(lang).email.required(),

      password: generalFields(lang).password.required(),

      phone: generalFields(lang).phone.required(),

      age: joi
        .number()
        .integer()
        .min(18)
        .max(100)
        .required()
        .messages({
          "number.base": getMessage("AGE_MUST_BE_NUMBER", lang),
          "number.integer": getMessage("AGE_MUST_BE_INTEGER", lang),
          "number.min": getMessage("EMPLOYEE_MIN_AGE", lang),
          "number.max": getMessage("EMPLOYEE_MAX_AGE", lang),
          "any.required": getMessage("AGE_REQUIRED", lang),
        }),

      dateOfBirth: joi
        .date()
        .max("now")
        .required()
        .messages({
          "date.base": getMessage("INVALID_DOB", lang),
          "date.max": getMessage("DOB_FUTURE", lang),
          "any.required": getMessage("DOB_REQUIRED", lang),
        }),

      gender: joi
        .string()
        .valid("male", "female", "other")
        .required()
        .messages({
          "string.base": getMessage("GENDER_STRING", lang),
          "any.only": getMessage("GENDER_VALID_VALUES", lang),
          "any.required": getMessage("GENDER_REQUIRED", lang),
        }),

      nationality: joi
        .string()
        .required()
        .messages({
          "string.base": getMessage("NATIONALITY_STRING", lang),
          "string.empty": getMessage("NATIONALITY_REQUIRED", lang),
          "any.required": getMessage("NATIONALITY_REQUIRED", lang),
        }),

      address: joi
        .string()
        .required()
        .messages({
          "string.base": getMessage("ADDRESS_STRING", lang),
          "string.empty": getMessage("ADDRESS_REQUIRED", lang),
          "any.required": getMessage("ADDRESS_REQUIRED", lang),
        }),

      city: joi
        .string()
        .required()
        .messages({
          "string.base": getMessage("CITY_STRING", lang),
          "string.empty": getMessage("CITY_REQUIRED", lang),
          "any.required": getMessage("CITY_REQUIRED", lang),
        }),

      nationalId: joi
        .string()
        .required()
        .messages({
          "string.base": getMessage("NATIONAL_ID_STRING", lang),
          "string.empty": getMessage("NATIONAL_ID_REQUIRED", lang),
          "any.required": getMessage("NATIONAL_ID_REQUIRED", lang),
        }),

      swiftCode: joi.string().allow("", null),

      IBAN: joi.string().allow("", null),

      permissions: generalFields(lang).id,

      station: generalFields(lang).id,

      salary: joi
        .number()
        .positive()
        .required()
        .messages({
          "number.base": getMessage("SALARY_NUMBER", lang),
          "number.positive": getMessage("SALARY_POSITIVE", lang),
          "any.required": getMessage("SALARY_REQUIRED", lang),
        }),

      timeWork: joi
        .string()
        .required()
        .messages({
          "string.base": getMessage("TIME_WORK_STRING", lang),
          "string.empty": getMessage("TIME_WORK_REQUIRED", lang),
          "any.required": getMessage("TIME_WORK_REQUIRED", lang),
        }),
      workFor: joi
        .string()
        .required()
        .messages({
          "string.base": getMessage("WORK-FOR_STRING", lang),
          "string.empty": getMessage("WORK-FOR_REQUIRED", lang),
          "any.required": getMessage("WORK-FOR_REQUIRED", lang),
        }),
      joiningDate: joi
        .date()
        .required()
        .messages({
          "date.base": getMessage("INVALID_JOINING_DATE", lang),
          "any.required": getMessage("JOINING_DATE_REQUIRED", lang),
        }),

      contractDuration: joi
        .date()
        .required()
        .messages({
          "date.base": getMessage("CONTRACT_DURATION_INVALID", lang),
          "any.required": getMessage("CONTRACT_DURATION_REQUIRED", lang),
        }),

      residenceExpiryDate: joi
        .date()
        .greater("now")
        .required()
        .messages({
          "date.base": getMessage("INVALID_RESIDENCE_EXPIRY", lang),
          "date.greater": getMessage("RESIDENCE_EXPIRY_FUTURE", lang),
          "any.required": getMessage("RESIDENCE_EXPIRY_REQUIRED", lang),
        }),

      documents: generateDocumentValidationSchema(lang),

      file: joi
        .any()
        .optional()
        .messages({
          "any.required": getMessage("FILE_REQUIRED", lang),
        }),
    })
    .required()
    .messages({
      "object.base": getMessage("INVALID_EMPLOYEE_DATA", lang),
      "object.required": getMessage("EMPLOYEE_DATA_REQUIRED", lang),
    });

//====================================================================================================================//
export const logInSchema = (lang = "en") =>
  joi
    .object({
      phoneOrEmail: generalFields(lang).phoneOrEmail.required(),

      password: generalFields(lang).password.required(),

      fcmToken: joi.string().required().messages({
        "string.base": getMessage("FCM_TOKEN_STRING", lang),
        "string.empty": getMessage("FCM_TOKEN_REQUIRED", lang),
        "any.required": getMessage("FCM_TOKEN_REQUIRED", lang),
      }),
    })
    .required()
    .messages({
      "object.base": getMessage("INVALID_LOGIN_DATA", lang),
      "object.required": getMessage("LOGIN_DATA_REQUIRED", lang),
    });
//====================================================================================================================//
// Update Employee Schema
export const updateEmployeeSchema = (lang = "en") =>
  joi
    .object({
      employeeId:generalFields(lang).id,

      name: generalFields(lang).name.optional().trim(),

      email: generalFields(lang).email.optional(),

      password: generalFields(lang).password.optional(),

      phone: generalFields(lang).phone.optional(),

      age: joi
        .number()
        .integer()
        .min(18)
        .max(100)
        .optional()
        .messages({
          "number.base": getMessage("AGE_MUST_BE_NUMBER", lang),
          "number.integer": getMessage("AGE_MUST_BE_INTEGER", lang),
          "number.min": getMessage("EMPLOYEE_MIN_AGE", lang),
          "number.max": getMessage("EMPLOYEE_MAX_AGE", lang),
        }),

      dateOfBirth: joi
        .date()
        .max("now")
        .optional()
        .messages({
          "date.base": getMessage("INVALID_DOB", lang),
          "date.max": getMessage("DOB_FUTURE", lang),
        }),

      gender: joi
        .string()
        .valid("male", "female", "other")
        .optional()
        .messages({
          "string.base": getMessage("GENDER_STRING", lang),
          "any.only": getMessage("GENDER_VALID_VALUES", lang),
        }),

      nationality: joi
        .string()
        .optional()
        .messages({
          "string.base": getMessage("NATIONALITY_STRING", lang),
        }),

      address: joi
        .string()
        .optional()
        .messages({
          "string.base": getMessage("ADDRESS_STRING", lang),
        }),

      city: joi
        .string()
        .optional()
        .messages({
          "string.base": getMessage("CITY_STRING", lang),
        }),

      nationalId: joi
        .string()
        .optional()
        .messages({
          "string.base": getMessage("NATIONAL_ID_STRING", lang),
        }),

      swiftCode: joi.string().allow("", null).optional(),

      IBAN: joi.string().allow("", null).optional(),

      permissions: generalFields(lang).id.optional(),

      station: joi
        .string()
        .optional()
        .messages({
          "string.base": getMessage("STATION_STRING", lang),
        }),

      salary: joi
        .number()
        .positive()
        .optional()
        .messages({
          "number.base": getMessage("SALARY_NUMBER", lang),
          "number.positive": getMessage("SALARY_POSITIVE", lang),
        }),

      timeWork: joi
        .string()
        .optional()
        .messages({
          "string.base": getMessage("TIME_WORK_STRING", lang),
        }),

      joiningDate: joi
        .date()
        .optional()
        .messages({
          "date.base": getMessage("INVALID_JOINING_DATE", lang),
        }),

      contractDuration: joi
        .date()
        .optional()
        .messages({
          "date.base": getMessage("CONTRACT_DURATION_INVALID", lang),
        }),

      residenceExpiryDate: joi
        .date()
        .greater("now")
        .optional()
        .messages({
          "date.base": getMessage("INVALID_RESIDENCE_EXPIRY", lang),
          "date.greater": getMessage("RESIDENCE_EXPIRY_FUTURE", lang),
        }),

      file: joi
        .any()
        .optional()
        .messages({
          "any.required": getMessage("FILE_REQUIRED", lang),
        }),
    })
    .optional()
    .messages({
      "object.base": getMessage("INVALID_EMPLOYEE_DATA", lang),
    });
