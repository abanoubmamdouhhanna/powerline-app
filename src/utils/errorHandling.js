// import { errorTranslations } from "../../languages/errorTranslations.js";

// export const asyncHandler = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch((error) => {
//       return next(error);
//     });
//   };
// };

// export const glopalErrHandling = async (error, req, res, next) => {
//   if (error) {
//     const lang = req.language;

//     // Get the translated message, fallback to original error message if not found
//     const errorMessage =
//       errorTranslations[error.message]?.[lang] ||
//       errorTranslations[error.message]?.["en"] ||
//       error.message;

//     if (process.env.MOOD == "DEV") {
//       return res.status(error.cause || 500).json({
//         message: errorMessage,
//         status_code: error.cause,
//         error,
//         stack: error.stack,
//       });
//     } else {
//       return res
//         .status(error.cause || 500)
//         .json({ message: errorMessage, status_code: error.cause });
//     }
//   }
// };
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

  const statusCode = error.statusCode || 500;

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
