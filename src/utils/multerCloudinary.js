import multer from "multer";
import { asyncHandler } from "./errorHandling.js";
import { dangerousExtensions } from "./dangerousExtensions.js";

export const allowedTypesMap = (() => {
  const imageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/x-icon",
    "image/svg+xml",
  ];

  const docTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ...imageTypes,
  ];

  return {
    profilePic: imageTypes,
    documentFiles: docTypes, // Generic document files type
  };
})();

const fileValidation = (allowedTypesMap = {}) => {
  return asyncHandler(async (req, file, cb) => {
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    if (dangerousExtensions.includes(fileExtension)) {
      return cb(
        new Error(`File type '${fileExtension}' not allowed`, { cause: 400 }),
        false
      );
    }

    // Check file type based on field name pattern
    if (file.fieldname === 'profilePic') {
      // Profile picture validation
      if (!allowedTypesMap.profilePic.includes(file.mimetype)) {
        return cb(
          new Error(`Invalid type for profile picture`, { cause: 400 }),
          false
        );
      }
    } else if (file.fieldname.startsWith('documentFiles_')) {
      // Document file validation
      if (!allowedTypesMap.documentFiles.includes(file.mimetype)) {
        return cb(
          new Error(`Invalid type for document file`, { cause: 400 }),
          false
        );
      }
    } else {
      // Unknown field
      return cb(
        new Error(`Unexpected file field: ${file.fieldname}`, { cause: 400 }),
        false
      );
    }

    cb(null, true);
  });
};

export function fileUpload(size, allowedTypesMap) {
  const storage = multer.diskStorage({});
  const limits = { fileSize: size * 1024 * 1024 };
  const fileFilter = fileValidation(allowedTypesMap);
  const upload = multer({ fileFilter, storage, limits });
  return upload;
}

// Use any() to accept any number of files with any field names
export function flexibleDocumentUpload(size = 5, maxTotalFiles = 5) {
  return (req, res, next) => {
    const upload = fileUpload(size, allowedTypesMap).any();
    
    upload(req, res, (err) => {
      if (err) return next(err);
      
      // Verify we don't exceed the maximum number of files
      if (req.files && req.files.length > maxTotalFiles) {
        return next(new Error(`Maximum of ${maxTotalFiles} files allowed`, { cause: 400 }));
      }
      
      // Organize files by field name for easier access in the controller
      const organizedFiles = {};
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (!organizedFiles[file.fieldname]) {
            organizedFiles[file.fieldname] = [];
          }
          organizedFiles[file.fieldname].push(file);
        });
      }
      
      // Replace req.files with our organized structure
      req.files = organizedFiles;
      
      next();
    });
  };
}