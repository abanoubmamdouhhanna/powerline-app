import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS VALIDATION SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== SUPPLIER MANAGEMENT SCHEMAS ==============================//

//=========================== ADD SUPPLIER VALIDATION SCHEMA ==========================//
export const addSupplierSchema = (lang = "en") =>
  joi
    .object({
      supplierName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("SUPPLIER_NAME_INVALID", lang),
          "string.empty": getMessage("SUPPLIER_NAME_REQUIRED", lang),
          "any.required": getMessage("SUPPLIER_NAME_REQUIRED", lang),
        }),

      phone: generalFields(lang).phone.required(),

      supplierWhatsAppLink: joi
        .string()
        .trim()
        .uri()
        .required()
        .messages({
          "string.base": getMessage("WHATSAPP_LINK_INVALID", lang),
          "string.empty": getMessage("WHATSAPP_LINK_REQUIRED", lang),
          "any.required": getMessage("WHATSAPP_LINK_REQUIRED", lang),
          "string.uri": getMessage("WHATSAPP_LINK_FORMAT_INVALID", lang),
        }),

      supplierAddress: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("ADDRESS_INVALID", lang),
          "string.empty": getMessage("ADDRESS_REQUIRED", lang),
          "any.required": getMessage("ADDRESS_REQUIRED", lang),
        }),

      swiftCode: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("SWIFT_CODE_INVALID", lang),
          "string.empty": getMessage("SWIFT_CODE_REQUIRED", lang),
          "any.required": getMessage("SWIFT_CODE_REQUIRED", lang),
        }),

      IBAN: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("IBAN_INVALID", lang),
          "string.empty": getMessage("IBAN_REQUIRED", lang),
          "any.required": getMessage("IBAN_REQUIRED", lang),
        }),

      file: generalFields(lang)
        .file.optional()
        .messages({
          "string.base": getMessage("SUPPLIER_IMAGE_INVALID", lang),
        }),
    })
    .required();

//=========================== UPDATE SUPPLIER VALIDATION SCHEMA ========================//
export const updateSupplierSchema = (lang = "en") =>
  joi
    .object({
      supplierId: generalFields(lang).id,
      supplierName: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("SUPPLIER_NAME_INVALID", lang),
          "string.empty": getMessage("SUPPLIER_NAME_REQUIRED", lang),
          "any.required": getMessage("SUPPLIER_NAME_REQUIRED", lang),
        }),

      phone: generalFields(lang).phone.optional(),

      supplierWhatsAppLink: joi
        .string()
        .trim()
        .uri()
        .optional()
        .messages({
          "string.base": getMessage("WHATSAPP_LINK_INVALID", lang),
          "string.empty": getMessage("WHATSAPP_LINK_REQUIRED", lang),
          "any.required": getMessage("WHATSAPP_LINK_REQUIRED", lang),
          "string.uri": getMessage("WHATSAPP_LINK_FORMAT_INVALID", lang),
        }),

      supplierAddress: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("ADDRESS_INVALID", lang),
          "string.empty": getMessage("ADDRESS_REQUIRED", lang),
          "any.required": getMessage("ADDRESS_REQUIRED", lang),
        }),

      swiftCode: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("SWIFT_CODE_INVALID", lang),
          "string.empty": getMessage("SWIFT_CODE_REQUIRED", lang),
          "any.required": getMessage("SWIFT_CODE_REQUIRED", lang),
        }),

      IBAN: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("IBAN_INVALID", lang),
          "string.empty": getMessage("IBAN_REQUIRED", lang),
          "any.required": getMessage("IBAN_REQUIRED", lang),
        }),

      file: generalFields(lang)
        .file.optional()
        .messages({
          "string.base": getMessage("SUPPLIER_IMAGE_INVALID", lang),
        }),
    })
    .required();

//=========================== SUPPLIER ID VALIDATION SCHEMA ===========================//
export const supplierIdSchema = (lang = "en") =>
  joi
    .object({
      supplierId: generalFields(lang).id,
    })
    .required();

//=========================== FUEL REQUEST SCHEMAS ===================================//

//=========================== CREATE REQUEST VALIDATION SCHEMA ========================//
export const supplierRequestSchema = (lang = "en") =>
  joi
    .object({
      employeeName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("EMPLOYEE_NAME_INVALID", lang),
          "string.empty": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
          "any.required": getMessage("EMPLOYEE_NAME_REQUIRED", lang),
        }),
      fuelAmount: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("FUEL_AMOUNT_INVALID", lang),
          "number.min": getMessage("FUEL_AMOUNT_MIN", lang),
          "any.required": getMessage("FUEL_AMOUNT_REQUIRED", lang),
        }),

      fuelType: joi
        .string()
        .valid("Green", "Diesel", "Red")
        .required()
        .trim()
        .messages({
          "string.base": getMessage("FUEL_TYPE_INVALID", lang),
          "any.only": getMessage("FUEL_TYPE_INVALID_OPTION", lang),
          "any.required": getMessage("FUEL_TYPE_REQUIRED", lang),
        }),
    })
    .required();

//=========================== REQUEST ID VALIDATION SCHEMA ===========================//
export const reqIdSchema = (lang = "en") =>
  joi
    .object({
      reqId: generalFields(lang).id,
    })
    .required();

//=========================== SEND TO SUPPLIER VALIDATION SCHEMA =====================//
export const sendToSupplierSchema = (lang = "en") =>
  joi
    .object({
      reqId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("REQUEST_ID_INVALID", lang),
          "string.empty": getMessage("REQUEST_ID_REQUIRED", lang),
          "any.required": getMessage("REQUEST_ID_REQUIRED", lang),
        }),

      stationName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("STATION_NAME_INVALID", lang),
          "string.empty": getMessage("STATION_NAME_REQUIRED", lang),
          "any.required": getMessage("STATION_NAME_REQUIRED", lang),
        }),

      fuelType: joi
        .string()
        .required()
        .trim()
        .messages({
          "string.base": getMessage("FUEL_TYPE_INVALID", lang),
          "any.only": getMessage("FUEL_TYPE_INVALID_OPTION", lang),
          "any.required": getMessage("FUEL_TYPE_REQUIRED", lang),
        }),

      fuelAmount: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("FUEL_AMOUNT_INVALID", lang),
          "number.min": getMessage("FUEL_AMOUNT_MIN", lang),
          "any.required": getMessage("FUEL_AMOUNT_REQUIRED", lang),
        }),

      supplierWhatsAppLink: joi
        .string()
        .trim()
        .uri()
        .required()
        .messages({
          "string.base": getMessage("WHATSAPP_LINK_INVALID", lang),
          "string.empty": getMessage("WHATSAPP_LINK_REQUIRED", lang),
          "any.required": getMessage("WHATSAPP_LINK_REQUIRED", lang),
          "string.uri": getMessage("WHATSAPP_LINK_FORMAT_INVALID", lang),
        }),
    })
    .required();

//=========================== SEND TO STATION VALIDATION SCHEMA =======================//
export const sendToStationSchema = (lang = "en") =>
  joi
    .object({
      reqId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("REQUEST_ID_INVALID", lang),
          "string.empty": getMessage("REQUEST_ID_REQUIRED", lang),
          "any.required": getMessage("REQUEST_ID_REQUIRED", lang),
        }),

      paymentMethod: joi
        .string()
        .valid("Bank Transfer", "Cash", "Credit Card")
        .required()
        .messages({
          "string.base": getMessage("PAYMENT_METHOD_INVALID", lang),
          "any.only": getMessage("PAYMENT_METHOD_INVALID_OPTION", lang),
          "any.required": getMessage("PAYMENT_METHOD_REQUIRED", lang),
        }),

      totalLiters: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("TOTAL_LITERS_INVALID", lang),
          "number.min": getMessage("TOTAL_LITERS_MIN", lang),
          "any.required": getMessage("TOTAL_LITERS_REQUIRED", lang),
        }),

      pricePerLiter: joi
        .number()
        .min(0)
        .required()
        .messages({
          "number.base": getMessage("PRICE_PER_LITER_INVALID", lang),
          "number.min": getMessage("PRICE_PER_LITER_MIN", lang),
          "any.required": getMessage("PRICE_PER_LITER_REQUIRED", lang),
        }),

      status: joi
        .string()
        .valid("Review underway")
        .required()
        .messages({
          "string.base": getMessage("STATUS_INVALID", lang),
          "any.only": getMessage("STATUS_MUST_BE_REVIEW", lang),
          "any.required": getMessage("STATUS_REQUIRED", lang),
        }),
    })
    .required();

//=========================== REVIEW REQUEST VALIDATION SCHEMA ========================//
export const reviewRequestSchema = (lang = "en") =>
  joi
    .object({
      reqId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("REQUEST_ID_INVALID", lang),
          "string.empty": getMessage("REQUEST_ID_REQUIRED", lang),
          "any.required": getMessage("REQUEST_ID_REQUIRED", lang),
        }),

      isCarCompleted: joi
        .string()
        .valid("Yes", "No")
        .required()
        .messages({
          "string.base": getMessage("CAR_COMPLETED_INVALID", lang),
          "any.only": getMessage("CAR_COMPLETED_OPTIONS", lang),
          "any.required": getMessage("CAR_COMPLETED_REQUIRED", lang),
        }),

      matchingSpecs: joi
        .string()
        .valid("Yes", "No")
        .required()
        .messages({
          "string.base": getMessage("MATCHING_SPECS_INVALID", lang),
          "any.only": getMessage("MATCHING_SPECS_OPTIONS", lang),
          "any.required": getMessage("MATCHING_SPECS_REQUIRED", lang),
        }),

      matchingSafety: joi
        .string()
        .valid("Yes", "No")
        .required()
        .messages({
          "string.base": getMessage("MATCHING_SAFETY_INVALID", lang),
          "any.only": getMessage("MATCHING_SAFETY_OPTIONS", lang),
          "any.required": getMessage("MATCHING_SAFETY_REQUIRED", lang),
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
