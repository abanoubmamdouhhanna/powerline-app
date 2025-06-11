import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS VALIDATION SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== GASOLINE TYPE VALIDATION SCHEMA ==========================//
export const gasolineTypeSchema = (lang = "en") =>
  joi
    .object({
      gasolineName: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("GASOLINE_NAME_REQUIRED", lang),
          "string.empty": getMessage("GASOLINE_NAME_REQUIRED", lang),
          "string.base": getMessage("GASOLINE_NAME_INVALID", lang),
        }),
    })
    .required();

//=========================== ADD PUMP VALIDATION SCHEMA ==============================//
export const addPumpSchema = (lang = "en") =>
  joi
    .object({
      station: generalFields(lang).id,
      pistolTypes: joi
        .array()
        .items(generalFields(lang).id)
        .min(1)
        .required()
        .messages({
          "any.required": getMessage("PISTOL_TYPES_REQUIRED", lang),
        }),
      pumpName: joi
        .string()
        .trim()
        .required()
        .messages({
          "any.required": getMessage("PUMP_NAME_REQUIRED", lang),
          "string.empty": getMessage("PUMP_NAME_REQUIRED", lang),
          "string.base": getMessage("PUMP_NAME_INVALID", lang),
        }),
    })
    .required();

//=========================== STATION ID VALIDATION SCHEMA ============================//
export const stationIdSchema = (lang = "en") =>
  joi
    .object({
      stationId: generalFields(lang).id,
    })
    .required();

//=========================== GET PUMP TYPES VALIDATION SCHEMA ========================//
export const getPumpTypesSchema = (lang = "en") =>
  joi
    .object({
      pumpId: generalFields(lang).id,
      stationId: generalFields(lang).id,
    })
    .required();

//=========================== ADD STATION VALIDATION SCHEMA ===========================//
export const addStationSchema = (lang = "en") =>
  joi
    .object({
      stationName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STATION_NAME_INVALID", lang),
          "string.empty": getMessage("STATION_NAME_REQUIRED", lang),
          "any.required": getMessage("STATION_NAME_REQUIRED", lang),
        }),

      stationAddress: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STATION_ADDRESS_INVALID", lang),
          "string.empty": getMessage("STATION_ADDRESS_REQUIRED", lang),
          "any.required": getMessage("STATION_ADDRESS_REQUIRED", lang),
        }),

      noOfPumps: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("NO_OF_PUMPS_INVALID", lang),
          "any.required": getMessage("NO_OF_PUMPS_REQUIRED", lang),
        }),

      noOfPistol: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("NO_OF_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_PISTOLS_REQUIRED", lang),
        }),

      supplier: generalFields(lang).id,

      noOfGreenPistol: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("NO_OF_GREEN_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_GREEN_PISTOLS_REQUIRED", lang),
        }),

      noOfRedPistol: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("NO_OF_RED_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_RED_PISTOLS_REQUIRED", lang),
        }),

      noOfDieselPistol: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("NO_OF_DIESEL_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_DIESEL_PISTOLS_REQUIRED", lang),
        }),

      documents: joi
        .array()
        .items(
          joi.object({
            title: joi
              .string()
              .trim()
              .required()
              .messages({
                "string.base": getMessage("DOCUMENT_TITLE_INVALID", lang),
                "any.required": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
              }),
            start: joi
              .date()
              .required()
              .messages({
                "date.base": getMessage("DOCUMENT_START_DATE_INVALID", lang),
                "any.required": getMessage(
                  "DOCUMENT_START_DATE_REQUIRED",
                  lang
                ),
              }),
            end: joi
              .date()
              .greater(joi.ref("start"))
              .required()
              .messages({
                "date.base": getMessage("DOCUMENT_END_DATE_INVALID", lang),
                "date.greater": getMessage("DOCUMENT_END_BEFORE_START", lang),
                "any.required": getMessage("DOCUMENT_END_DATE_REQUIRED", lang),
              }),
          })
        )
        .optional(),

      stores: joi
        .array()
        .items(
          joi.object({
            storeName: joi
              .string()
              .trim()
              .required()
              .messages({
                "string.base": getMessage("STORE_NAME_INVALID", lang),
                "any.required": getMessage("STORE_NAME_REQUIRED", lang),
              }),
            description: joi
              .string()
              .trim()
              .required()
              .messages({
                "string.base": getMessage("STORE_DESCRIPTION_INVALID", lang),
                "any.required": getMessage("STORE_DESCRIPTION_REQUIRED", lang),
              }),
            residenceExpiryDate: joi
              .date()
              .required()
              .messages({
                "date.base": getMessage("RESIDENCE_EXPIRY_DATE_INVALID", lang),
                "any.required": getMessage(
                  "RESIDENCE_EXPIRY_DATE_REQUIRED",
                  lang
                ),
              }),
          })
        )
        .optional(),

      file: joi
        .object()
        .pattern(
          joi.string(),
          joi.array().items(generalFields(lang).fileMetaSchema).min(1)
        )
        .required()
        .messages({
          "object.base": getMessage("FILES_INVALID", lang),
          "any.required": getMessage("FILES_REQUIRED", lang),
        }),
    })
    .required();

//=========================== UPDATE STATION VALIDATION SCHEMA ========================//
export const updateStationSchema = (lang = "en") =>
  joi
    .object({
      stationId: generalFields(lang).id,
      stationName: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("STATION_NAME_INVALID", lang),
          "string.empty": getMessage("STATION_NAME_REQUIRED", lang),
          "any.required": getMessage("STATION_NAME_REQUIRED", lang),
        }),

      stationAddress: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("STATION_ADDRESS_INVALID", lang),
          "string.empty": getMessage("STATION_ADDRESS_REQUIRED", lang),
          "any.required": getMessage("STATION_ADDRESS_REQUIRED", lang),
        }),

      noOfPumps: joi
        .number()
        .min(0)
        .optional()
        .messages({
          "number.base": getMessage("NO_OF_PUMPS_INVALID", lang),
          "any.required": getMessage("NO_OF_PUMPS_REQUIRED", lang),
        }),

      noOfPistol: joi
        .number()
        .min(0)
        .optional()
        .messages({
          "number.base": getMessage("NO_OF_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_PISTOLS_REQUIRED", lang),
        }),

      supplier: generalFields(lang).optionalId,

      noOfGreenPistol: joi
        .number()
        .min(0)
        .optional()
        .messages({
          "number.base": getMessage("NO_OF_GREEN_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_GREEN_PISTOLS_REQUIRED", lang),
        }),

      noOfRedPistol: joi
        .number()
        .min(0)
        .optional()
        .messages({
          "number.base": getMessage("NO_OF_RED_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_RED_PISTOLS_REQUIRED", lang),
        }),

      noOfDieselPistol: joi
        .number()
        .min(0)
        .optional()
        .messages({
          "number.base": getMessage("NO_OF_DIESEL_PISTOLS_INVALID", lang),
          "any.required": getMessage("NO_OF_DIESEL_PISTOLS_REQUIRED", lang),
        }),

      documents: joi
        .array()
        .items(
          joi.object({
            title: joi
              .string()
              .trim()
              .optional()
              .messages({
                "string.base": getMessage("DOCUMENT_TITLE_INVALID", lang),
                "any.required": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
              }),
            start: joi
              .date()
              .optional()
              .messages({
                "date.base": getMessage("DOCUMENT_START_DATE_INVALID", lang),
                "any.required": getMessage(
                  "DOCUMENT_START_DATE_REQUIRED",
                  lang
                ),
              }),
            end: joi
              .date()
              .greater(joi.ref("start"))
              .optional()
              .messages({
                "date.base": getMessage("DOCUMENT_END_DATE_INVALID", lang),
                "date.greater": getMessage("DOCUMENT_END_BEFORE_START", lang),
                "any.required": getMessage("DOCUMENT_END_DATE_REQUIRED", lang),
              }),
          })
        )
        .optional(),

      stores: joi
        .array()
        .items(
          joi.object({
            storeName: joi
              .string()
              .trim()
              .optional()
              .messages({
                "string.base": getMessage("STORE_NAME_INVALID", lang),
                "any.required": getMessage("STORE_NAME_REQUIRED", lang),
              }),
            description: joi
              .string()
              .trim()
              .optional()
              .messages({
                "string.base": getMessage("STORE_DESCRIPTION_INVALID", lang),
                "any.required": getMessage("STORE_DESCRIPTION_REQUIRED", lang),
              }),
            residenceExpiryDate: joi
              .date()
              .optional()
              .messages({
                "date.base": getMessage("RESIDENCE_EXPIRY_DATE_INVALID", lang),
                "any.required": getMessage(
                  "RESIDENCE_EXPIRY_DATE_REQUIRED",
                  lang
                ),
              }),
          })
        )
        .optional(),

      file: joi
        .object()
        .pattern(
          joi.string(),
          joi.array().items(generalFields(lang).fileMetaSchema).min(1)
        )
        .optional()
        .messages({
          "object.base": getMessage("FILES_INVALID", lang),
          "any.required": getMessage("FILES_REQUIRED", lang),
        }),
    })
    .required();

//=========================== DELETE DOCUMENT VALIDATION SCHEMA =======================//
export const deleteDocumentSchema = (lang = "en") =>
  joi
    .object({
      docId: generalFields(lang).id,
      stationId: generalFields(lang).id,
    })
    .required();

//=========================== DOCUMENT VALIDATION SCHEMA =============================//
export const documentValidationSchema = (lang = "en") =>
  joi
    .object({
      stationId: generalFields(lang).id,
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
      file: joi
        .object()
        .pattern(
          joi.string(),
          joi.array().items(generalFields(lang).fileMetaSchema).min(1)
        )
        .required()
        .messages({
          "object.base": getMessage("FILES_INVALID", lang),
          "any.required": getMessage("FILES_REQUIRED", lang),
        }),
    })
    .required();

//=========================== DELETE STORE VALIDATION SCHEMA =========================//
export const deleteStoreSchema = (lang = "en") =>
  joi
    .object({
      storeId: generalFields(lang).id,
      stationId: generalFields(lang).id,
    })
    .required();

//=========================== ADD STATION STORE VALIDATION SCHEMA ====================//
export const addStationStoreSchema = (lang = "en") =>
  joi
    .object({
      stationId: generalFields(lang).id,
      storeName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STORE_NAME_INVALID", lang),
          "any.required": getMessage("STORE_NAME_REQUIRED", lang),
        }),
      description: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STORE_DESCRIPTION_INVALID", lang),
          "any.required": getMessage("STORE_DESCRIPTION_REQUIRED", lang),
        }),
      residenceExpiryDate: joi
        .date()
        .required()
        .messages({
          "date.base": getMessage("RESIDENCE_EXPIRY_DATE_INVALID", lang),
          "any.required": getMessage("RESIDENCE_EXPIRY_DATE_REQUIRED", lang),
        }),
        file: joi
        .object()
        .pattern(
          joi.string(),
          joi.array().items(generalFields(lang).fileMetaSchema).min(1)
        )
        .required()
        .messages({
          "object.base": getMessage("FILES_INVALID", lang),
          "any.required": getMessage("FILES_REQUIRED", lang),
        }),
    })
    .required();

//=========================== PRICE VALIDATION SCHEMA ================================//
const priceSchema = joi.number().min(0).default(0).messages({
  "number.base": "Price must be a number",
  "number.min": "Price cannot be negative",
  "any.required": "Price is required",
});

//=========================== ADD GASOLINE PRICE VALIDATION SCHEMA ===================//
export const addGasolinePriceSchema = (lang = "en") =>
  joi
    .object({
      station: generalFields(lang).id,
      redPrice: priceSchema.required(),
      greenPrice: priceSchema.required(),
      dieselPrice: priceSchema.required(),
    })
    .required();

//=========================== UPDATE GASOLINE PRICE VALIDATION SCHEMA ================//
export const updateGasolinePriceSchema = (lang = "en") =>
  joi
    .object({
      priceId: generalFields(lang).id,
      redPrice: priceSchema,
      greenPrice: priceSchema,
      dieselPrice: priceSchema,
    })
    .required();

//=========================== JOB TASK STATION VALIDATION SCHEMA ============================//
export const getJobTaskByIdSchema = (lang = "en") =>
  joi
    .object({
      stationId: generalFields(lang).id,
      taskId:generalFields(lang).id
    })
    .required();