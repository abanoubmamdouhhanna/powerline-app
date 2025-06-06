import joi from "joi";
import { generalFields } from "../../../utils/generalFields.js";
import { ValidationErrors } from "../../../../languages/validationErrorTranslation.js";

const getMessage = (key, lang = "en") => {
  return ValidationErrors[key]?.[lang] || ValidationErrors[key]?.en || key;
};

//=========================== HEADERS VALIDATION SCHEMA ================================//
export const headersSchema = (lang = "en") => generalFields(lang).headers;

//=========================== CREATE TASK VALIDATION SCHEMA ============================//
export const createTaskSchema = (lang = "en") =>
  joi
    .object({
      // Required fields
      taskName: joi
        .string()
        .trim()
        .required()
        .messages({
          "string.base": getMessage("TASK_NAME_INVALID", lang),
          "string.empty": getMessage("TASK_NAME_REQUIRED", lang),
          "any.required": getMessage("TASK_NAME_REQUIRED", lang),
        }),

      startDate: joi
        .date()
        .required()
        .messages({
          "date.base": getMessage("START_DATE_INVALID", lang),
          "any.required": getMessage("START_DATE_REQUIRED", lang),
        }),

      deadline: joi
        .date()
        .required()
        .greater(joi.ref("startDate"))
        .messages({
          "date.base": getMessage("DEADLINE_INVALID", lang),
          "any.required": getMessage("DEADLINE_REQUIRED", lang),
          "date.greater": getMessage("DEADLINE_MUST_BE_AFTER_START", lang),
        }),

      // Optional fields
      taskDetails: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("TASK_DETAILS_INVALID", lang),
        }),

      comment: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("COMMENT_INVALID", lang),
        }),

      // User reference
      user: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("USER_ID_INVALID", lang),
          "string.empty": getMessage("USER_ID_REQUIRED", lang),
          "any.required": getMessage("USER_ID_REQUIRED", lang),
        }),

      // Documents validation with file handling
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
                "string.empty": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
                "any.required": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
              }),
          })
        )
        .optional()
        .messages({
          "array.base": getMessage("DOCUMENTS_MUST_BE_ARRAY", lang),
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
    .required()
    .messages({
      "object.base": getMessage("INVALID_TASK_DATA", lang),
      "object.required": getMessage("TASK_DATA_REQUIRED", lang),
    });

//=========================== GET TASK BY USER ID SCHEMA ==============================//
export const getTaskbyUserIDSchema = (lang = "en") =>
  joi
    .object({
      userId: generalFields(lang).id,
    })
    .required();

//=========================== CHANGE TASK STATUS SCHEMA ===============================//
export const changeStatusSchema = (lang = "en") =>
  joi
    .object({
      status: joi
        .string()
        .valid("Not Started", "To Do", "Completed")
        .required()
        .messages({
          "string.base": getMessage("STATUS_INVALID", lang),
          "any.only": getMessage("STATUS_INVALID_OPTION", lang),
          "any.required": getMessage("STATUS_REQUIRED", lang),
        }),

      taskId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("TASK_ID_INVALID", lang),
          "string.empty": getMessage("TASK_ID_REQUIRED", lang),
          "any.required": getMessage("TASK_ID_REQUIRED", lang),
        }),
    })
    .required();

//=========================== UPDATE TASK VALIDATION SCHEMA ===========================//
export const updateTaskSchema = (lang = "en") =>
  joi
    .object({
      taskId: generalFields(lang)
      .id.required()
      .messages({
        "string.base": getMessage("TASK_ID_INVALID", lang),
        "string.empty": getMessage("TASK_ID_REQUIRED", lang),
        "any.required": getMessage("TASK_ID_REQUIRED", lang),
      }),
      // Optional fields (all fields are optional for update)
      taskName: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("TASK_NAME_INVALID", lang),
        }),

      startDate: joi
        .date()
        .optional()
        .messages({
          "date.base": getMessage("START_DATE_INVALID", lang),
        }),

      deadline: joi
        .date()
        .optional()
        .when("startDate", {
          is: joi.exist(),
          then: joi.date().greater(joi.ref("startDate")),
          otherwise: joi.date(),
        })
        .messages({
          "date.base": getMessage("DEADLINE_INVALID", lang),
          "date.greater": getMessage("DEADLINE_MUST_BE_AFTER_START", lang),
        }),

      taskDetails: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("TASK_DETAILS_INVALID", lang),
        }),

      comment: joi
        .string()
        .trim()
        .optional()
        .messages({
          "string.base": getMessage("COMMENT_INVALID", lang),
        }),

      user: generalFields(lang)
        .id.optional()
        .messages({
          "string.base": getMessage("USER_ID_INVALID", lang),
        }),

      // Documents validation (optional for update)
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
                "string.empty": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
                "any.required": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
              }),
            _id: generalFields(lang)
              .id.optional()
              .messages({
                "string.base": getMessage("DOCUMENT_ID_INVALID", lang),
              }),
          })
        )
        .optional()
        .messages({
          "array.base": getMessage("DOCUMENTS_MUST_BE_ARRAY", lang),
        }),

      file: joi
        .object()
        .pattern(
          joi.string(),
          joi.array().items(generalFields(lang).fileMetaSchema).min(1)
        )
        .optional()
        .messages({
          "object.base": getMessage("FILES_INVALID", lang),
          "object.pattern.match": getMessage("FILES_PATTERN_INVALID", lang),
        }),
    })
    .min(1) // At least one field should be provided for update
    .messages({
      "object.base": getMessage("INVALID_TASK_DATA", lang),
      "object.min": getMessage("AT_LEAST_ONE_FIELD_REQUIRED", lang),
    });

//=========================== DELETE TASK SCHEMA ======================================//
export const deleteTaskSchema = (lang = "en") =>
  joi
    .object({
      taskId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("TASK_ID_INVALID", lang),
          "string.empty": getMessage("TASK_ID_REQUIRED", lang),
          "any.required": getMessage("TASK_ID_REQUIRED", lang),
        }),
    })
    .required();

//=========================== DELETE TASK DOCUMENT SCHEMA ============================//
export const deleteTaskDocumentSchema = (lang = "en") =>
  joi
    .object({
      documentId: generalFields(lang).id,
      taskId: generalFields(lang)
        .id.required()
        .messages({
          "string.base": getMessage("TASK_ID_INVALID", lang),
          "string.empty": getMessage("TASK_ID_REQUIRED", lang),
          "any.required": getMessage("TASK_ID_REQUIRED", lang),
        }),
    })
    .required();

//=========================== ADD TASK DOCUMENT SCHEMA ================================//
export const addTaskDocumentSchema = (lang = "en") =>
  joi.object({
    taskId: generalFields(lang)
      .id.required()
      .messages({
        "string.base": getMessage("TASK_ID_INVALID", lang),
        "string.empty": getMessage("TASK_ID_REQUIRED", lang),
        "any.required": getMessage("TASK_ID_REQUIRED", lang),
      }),

    title: joi
      .string()
      .trim()
      .required()
      .messages({
        "string.base": getMessage("DOCUMENT_TITLE_INVALID", lang),
        "string.empty": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
        "any.required": getMessage("DOCUMENT_TITLE_REQUIRED", lang),
      }),

    start: joi
      .date()
      .iso()
      .required()
      .messages({
        "date.base": getMessage("START_DATE_INVALID", lang),
        "date.format": getMessage("START_DATE_INVALID", lang),
        "any.required": getMessage("START_DATE_REQUIRED", lang),
      }),

    end: joi
      .date()
      .iso()
      .greater(joi.ref("start"))
      .required()
      .messages({
        "date.base": getMessage("END_DATE_INVALID", lang),
        "date.greater": getMessage("END_DATE_GREATER_THAN_START", lang),
        "any.required": getMessage("END_DATE_REQUIRED", lang),
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
  });
