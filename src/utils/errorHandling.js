import { errorTranslations } from "../../languages/errorTranslations.js";

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // cleaner
  };
};

export const glopalErrHandling = (error, req, res, next) => {
  const lang = req.language || "en";

  const errorMessage =
    errorTranslations[error.message]?.[lang] ||
    errorTranslations[error.message]?.["en"] ||
    error.message;

  const statusCode = error.cause || 500;

  const errorResponse = {
    message: errorMessage,
    status_code: statusCode,
  };

  if (process.env.MOOD === "DEV") {
    errorResponse.error = error;
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};
