import userModel from "../../../../DB/models/User.model.js";
import { compare, Hash } from "../../../utils/Hash&Compare.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { generateToken } from "../../../utils/generateAndVerifyToken.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { capitalizeWords } from "../../../utils/capitalize.js";
import {
  deleteFromCloudinary,
  uploadImageCloudinary,
  uploadToCloudinary,
} from "../../../utils/cloudinaryHelpers.js";
import { nanoid } from "nanoid";
import cloudinary from "../../../utils/cloudinary.js";
import attendanceModel from "../../../../DB/models/Attendance.model.js";
import cleaningTaskModel from "../../../../DB/models/CleaningTask.model.js";
import inventoryTaskModel from "../../../../DB/models/InventoryTask.model.js";
import stationModel from "../../../../DB/models/Station.model.js";

//create Employee
export const createEmployee = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    password,
    phone,
    age,
    dateOfBirth,
    gender,
    nationality,
    address,
    city,
    nationalId,
    swiftCode,
    IBAN,
    permissions,
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
    documents: documentsData,
  } = req.body;

  const formattedName = capitalizeWords(name);
  const customId = nanoid();

  // Check for duplicates in parallel
  const [existingEmail, existingPhone, existingStation] = await Promise.all([
    userModel.findOne({ email }),
    userModel.findOne({ phone }),
    stationModel.findOne({ _id: station }),
  ]);
  if (existingEmail)
    return next(new Error("Email already exists", { cause: 401 }));
  if (existingPhone)
    return next(new Error("Phone number already exists", { cause: 401 }));
  if (!existingStation)
    return next(new Error("Station not found", { cause: 404 }));

  const uploadedFiles = req.files || {};

  // Upload profile pic (if exists)
  const profilePicFile = uploadedFiles?.profilePic?.[0];
  const imageUrl = profilePicFile
    ? await uploadImageCloudinary(
        profilePicFile,
        `${process.env.APP_NAME}/Users/${customId}/profilePic`,
        `${customId}_profilePic`
      )
    : null;

  // Process document uploads in parallel
  const processedDocuments = Array.isArray(documentsData)
    ? await Promise.all(
        documentsData.map(async (doc, i) => {
          const { title, start, end } = doc;

          if (!title || !start || !end) {
            throw new Error(
              "Each document must have title, start date, and end date"
            );
          }

          const files = uploadedFiles[`documentFiles_${i}`] || [];
          const folder = `${process.env.APP_NAME}/Users/${customId}/documents/document_${i}`;

          const fileUploads = await Promise.all(
            files.map((file) =>
              uploadToCloudinary(
                file,
                folder,
                `${customId}_document_${i}_${file.originalname}`
              )
            )
          );

          return {
            title,
            start: new Date(start),
            end: new Date(end),
            files: fileUploads,
          };
        })
      )
    : [];

  // Create employee record
  const newEmployee = await userModel.create({
    name: formattedName,
    email,
    password: Hash({ plainText: password }),
    phone,
    age,
    dateOfBirth,
    gender,
    nationality,
    address,
    city,
    imageUrl,
    nationalId,
    swiftCode,
    IBAN,
    customId,
    permissions,
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
    documents: processedDocuments,
  });
  existingStation.employees.push(newEmployee._id);
  await existingStation.save();

  return res.status(201).json({
    message: getTranslation("Account created successfully", req.language),
    result: newEmployee,
  });
});

//====================================================================================================================//
//log in

export const logIn = asyncHandler(async (req, res, next) => {
  const { phoneOrEmail, password } = req.body;

  // Validate input data
  if (!password || !phoneOrEmail) {
    return next(
      new Error("phone or email and password are required", { cause: 400 })
    );
  }

  // Query user by either userName or email
  const user = await userModel
    .findOne({
      $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail }],
    })
    .select(
      "name password phone email employeeCode status role imageUrl isActive"
    );
  if (!user) {
    return next(
      new Error("User not found", {
        cause: 404,
      })
    );
  }

  if (!user?.isActive) {
    return next(
      new Error("Account is deactivated by admin. Please contact support", {
        cause: 403,
      })
    );
  }

  // Handle user not found or inactive accounts
  if (!user) {
    return next(
      new Error("Invalid credentials, please try again", { cause: 404 })
    );
  }

  // Verify password
  const isPasswordValid = compare({
    plainText: password,
    hashValue: user.password,
  });
  if (!isPasswordValid) {
    return next(
      new Error("Incorrect password Please try again", { cause: 401 })
    );
  }
  const tokenExpiry = "30d";
  // Generate JWT token
  const token = generateToken({
    payload: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeCode: user.employeeCode,
    },
    expiresIn: tokenExpiry,
  });
  res.cookie("jwt", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });

  let loggedIn = false;

  if (user.status !== "Active") {
    user.status = "Active";
    loggedIn = true;
  }

  if (user.availability !== "loggedIn") {
    user.availability = "loggedIn";
    loggedIn = true;
  }
  if (loggedIn) {
    await user.save();
  }
  // Respond to client
  return res.status(200).json({
    message: getTranslation("Welcome! Logged in successfully", req.language),
    authorization: { token },
    result: user,
  });
});
//====================================================================================================================//
//log out
export const logOut = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(
    req.user._id,
    { availability: "loggedOut" },
    { new: true }
  );
  res.cookie("jwt", "", {
    maxAge: 1,
    sameSite: "None",
    secure: true,
  });
  return res.status(200).json({
    status: "success",
    message: getTranslation("Logged out successfully", req.language),
  });
});
//====================================================================================================================//
//update employee
export const updateEmployee = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;

  const existingEmployee = await userModel.findById(employeeId);
  if (!existingEmployee) {
    return next(new Error("Employee not found", { cause: 404 }));
  }

  const {
    name,
    email,
    password,
    phone,
    age,
    dateOfBirth,
    gender,
    nationality,
    address,
    city,
    nationalId,
    swiftCode,
    IBAN,
    permissions,
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
  } = req.body;

  const formattedName = name ? capitalizeWords(name) : undefined;
  const uploadedFiles = req.files || {};

  // Check for updated email or phone duplicates
  const [existingEmail, existingPhone] = await Promise.all([
    email && email !== existingEmployee.email
      ? userModel.findOne({ email })
      : null,
    phone && phone !== existingEmployee.phone
      ? userModel.findOne({ phone })
      : null,
  ]);
  if (existingEmail)
    return next(new Error("Email already exists", { cause: 409 }));
  if (existingPhone)
    return next(new Error("Phone number already exists", { cause: 409 }));

  // Update profile pic if provided
  const profilePicFile = uploadedFiles?.profilePic?.[0];
  if (profilePicFile) {
    const profilePicFolder = `${process.env.APP_NAME}/Users/${existingEmployee.customId}/profilePic`;
    await deleteFromCloudinary(profilePicFolder);

    existingEmployee.imageUrl = await uploadToCloudinary(
      profilePicFile,
      profilePicFolder,
      `${existingEmployee.customId}_profilePic_${profilePicFile.originalname}`
    );
  }

  // Update fields (only if provided)
  const fieldsToUpdate = {
    name: formattedName,
    email,
    password: password ? Hash({ plainText: password }) : undefined,
    phone,
    age,
    dateOfBirth,
    gender,
    nationality,
    address,
    city,
    nationalId,
    swiftCode,
    IBAN,
    permissions,
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
  };

  // Apply fields
  Object.entries(fieldsToUpdate).forEach(([key, value]) => {
    if (value !== undefined) existingEmployee[key] = value;
  });

  await existingEmployee.save();

  return res.status(200).json({
    message: getTranslation("Employee updated successfully", req.language),
    result: existingEmployee,
  });
});
//====================================================================================================================//
// Delete employee
export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;

  const existingEmployee = await userModel.findById(employeeId);
  if (!existingEmployee) {
    return next(new Error("Employee not found", { cause: 404 }));
  }

  try {
    const folderBase = `${process.env.APP_NAME}/Users/${existingEmployee.customId}`;

    const fileInfos = existingEmployee.documents.flatMap((doc) => doc.files);

    // Delete each file with the correct resource_type
    await Promise.all(
      fileInfos.map(({ public_id, resource_type }) =>
        cloudinary.uploader.destroy(public_id, { resource_type })
      )
    );
    // Delete the Cloudinary folder (must be empty)
    await deleteFromCloudinary(folderBase);

    // Remove from DB
    await existingEmployee.deleteOne();

    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    return next(new Error("Failed to delete employee", { cause: 500 }));
  }
});
//====================================================================================================================//
// Delete document
export const deleteDocument = asyncHandler(async (req, res, next) => {
  const { docId, userId } = req.body;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const documentIndex = user.documents.findIndex(
    (doc) => doc._id.toString() === docId
  );

  if (documentIndex === -1) {
    return next(new Error("Document not found", { cause: 404 }));
  }

  const [documentToDelete] = user.documents.splice(documentIndex, 1);
  const files = documentToDelete.files;

  if (!files.length) {
    return next(
      new Error("No files to delete in this document", { cause: 404 })
    );
  }

  // Extract folderBase from the first file's public_id
  const firstFilePublicId = files[0].public_id;
  const folderBase = firstFilePublicId.substring(
    0,
    firstFilePublicId.lastIndexOf("/")
  );

  // Delete all files from Cloudinary
  try {
    const deletePromises = files.map((file) =>
      cloudinary.uploader.destroy(file.public_id, {
        resource_type: file.resource_type || "raw",
      })
    );

    const results = await Promise.allSettled(deletePromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`File ${files[index].public_id} deleted successfully.`);
      } else {
        console.error(
          `Error deleting file ${files[index].public_id}:`,
          result.reason
        );
      }
    });

    // Delete folder after all files are handled
    try {
      await deleteFromCloudinary(folderBase);
      console.log(`Folder ${folderBase} deleted successfully.`);
    } catch (folderErr) {
      console.error(`Failed to delete folder ${folderBase}:`, folderErr);
    }
  } catch (err) {
    console.error("Error while deleting files from Cloudinary:", err);
    return next(
      new Error("Error deleting files from Cloudinary", { cause: 500 })
    );
  }

  await user.save();

  return res.status(200).json({
    message: "Document and associated files & folder deleted successfully",
  });
});
//====================================================================================================================//
// add new document
export const addUserDocument = asyncHandler(async (req, res, next) => {
  const { userId, title, start, end } = req.body;

  if (!title || !start || !end || !req.files) {
    return next(
      new Error("Missing required fields or document files", { cause: 400 })
    );
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const documentIndex = user.documents.length;
  const folder = `${process.env.APP_NAME}/Users/${user.customId}/documents/document_${documentIndex}`;

  const uploadedFiles = await Promise.all(
    Object.values(req.files)
      .flat()
      .map((file) =>
        uploadToCloudinary(
          file,
          folder,
          `${user.customId}_document_${documentIndex}_${file.originalname}`
        )
      )
  );

  const newDocument = {
    title,
    start: new Date(start),
    end: new Date(end),
    files: uploadedFiles,
  };

  user.documents.push(newDocument);
  await user.save();

  return res.status(201).json({
    message: "Document added successfully",
    document: user.documents.at(-1),
  });
});
//====================================================================================================================//
//get all employees
export const getAllEmployees = asyncHandler(async (req, res, next) => {
  const employees = await userModel.find(
    { role: "employee" },
    "name email imageUrl employeeCode timeWork"
  );
  return res.status(201).json({
    status: "success",
    count: employees.length,
    result: employees,
  });
});
//====================================================================================================================//
//user attendance
export const userAttendance = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  const attendance = await attendanceModel.find(
    { user: userId },
    "date checkIn checkOut workingHours status"
  );
  return res.status(201).json({
    status: "success",
    attendanceDays: attendance.length,
    result: attendance,
  });
});
//====================================================================================================================//
//get job tasks
export const getJobTasks = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  const cleaningTasks = await cleaningTaskModel.find(
    { user: userId },
    "subTask date time location employeeName cleaningImages"
  );
  const inventoryTasks = await inventoryTaskModel.find(
    { user: userId },
    "subTask date time location employeeName inventoryImages"
  );

  return res.status(200).json({
    status: "success",
    data: {
      cleaningTasks,
      inventoryTasks,
    },
  });
});
