import cloudinary from "./cloudinary.js";
import mime from "mime-types"; // install with: npm i mime-types

//only images
export const uploadImageCloudinary = async (file, folderpath, publicId) => {
  if (!file?.path) return null;
  try {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: folderpath,
      public_id: publicId,
    });
    return uploadResult.secure_url;
  } catch (error) {
    throw new Error(`Failed to upload ${publicId}`, { cause: 500 });
  }
};

//====================================================================================================================//
//images and files
export const uploadToCloudinary = async (file, folderpath, publicId) => {
  if (!file?.path) return null;

  const mimetype = mime.lookup(file.path);
  const isImage = mimetype && mimetype.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  try {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: folderpath,
      public_id: publicId,
      resource_type: resourceType,
    });

    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: resourceType,
    };
  } catch (error) {
    throw new Error(`Failed to upload ${publicId}`, { cause: 500 });
  }
};

//====================================================================================================================//
// upload buffer
export const uploadBufferToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: publicId,
      resource_type: "image",
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      })
      .end(buffer);
  });
};
//====================================================================================================================//
// Helper function to delete resources by folder
export const deleteFromCloudinary = async (folderPath) => {
  return new Promise((resolve, reject) => {
    cloudinary.api.delete_resources_by_prefix(folderPath, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      // Also delete the empty folder after resources are removed
      cloudinary.api.delete_folder(folderPath, (folderError) => {
        if (folderError) {
          console.warn("Could not delete empty folder:", folderError);
        }
        resolve(result);
      });
    });
  });
};
