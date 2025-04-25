import multer from "multer";
import { asyncHandler } from "./errorHandling.js";
import { dangerousExtensions } from "./dangerousExtensions.js";

// Define allowed MIME types by base field name
export const allowedTypesMap = (() => {
  const baseImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/x-icon",
    "image/svg+xml",
  ];

  const baseDocTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.rar", // .rar
    "application/zip", // .zip
  ];

  return {
    profilePic: baseImageTypes,
    cleaningImages: baseImageTypes,
    inventoryImages: baseImageTypes,
    shopImage: baseImageTypes,
    documentFiles: [...baseDocTypes, ...baseImageTypes],
    documents: [...baseDocTypes, ...baseImageTypes],
    leaseDoc: [...baseDocTypes, ...baseImageTypes],
  };
})();

// Get base field name (e.g., "documentFiles" from "documentFiles_0")
const getBaseFieldName = (fieldname) => {
  const match = fieldname.match(/^([a-zA-Z]+)/); // Extract prefix before underscore/digit
  return match ? match[1] : fieldname;
};

// File validation middleware
const fileValidation = (allowedTypesMap = {}) => {
  return asyncHandler(async (req, file, cb) => {
    const fileExtension = file.originalname.split(".").pop().toLowerCase();

    if (dangerousExtensions.includes(fileExtension)) {
      return cb(
        new Error(
          `File type '${fileExtension}' not allowed (dangerous extension)`,
          { cause: 400 }
        ),
        false
      );
    }

    const baseFieldName = getBaseFieldName(file.fieldname);
    const allowedMimesForField = allowedTypesMap[baseFieldName];

    if (!allowedMimesForField) {
      return cb(
        new Error(`Field '${file.fieldname}' is not allowed for file uploads`, {
          cause: 400,
        }),
        false
      );
    }

    if (!allowedMimesForField.includes(file.mimetype)) {
      return cb(
        new Error(
          `MIME type '${file.mimetype}' is not allowed for field '${file.fieldname}'`,
          { cause: 400 }
        ),
        false
      );
    }

    cb(null, true);
  });
};

// File upload config
export function fileUpload(size, allowedTypesMap) {
  const storage = multer.diskStorage({});
  const limits = { fileSize: size * 1024 * 1024 }; // Size in MB
  const fileFilter = fileValidation(allowedTypesMap);
  return multer({ fileFilter, storage, limits });
}

// Flexible upload with any() and dynamic field support
export function flexibleDocumentUpload(size = 5, maxTotalFiles = 5) {
  return (req, res, next) => {
    const upload = fileUpload(size, allowedTypesMap).any();

    upload(req, res, (err) => {
      if (err) return next(err);

      if (req.files && req.files.length > maxTotalFiles) {
        return next(
          new Error(`Maximum of ${maxTotalFiles} files allowed`, { cause: 400 })
        );
      }

      const organizedFiles = {};
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          if (!organizedFiles[file.fieldname]) {
            organizedFiles[file.fieldname] = [];
          }
          organizedFiles[file.fieldname].push(file);
        });
      }

      req.files = organizedFiles;
      next();
    });
  };
}
