import userModel from "../../../../DB/models/User.model.js";
import { compare, Hash } from "../../../utils/Hash&Compare.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { generateToken } from "../../../utils/generateAndVerifyToken.js";
import { getTranslation } from "../../../middlewares/language.middleware.js";
import { capitalizeWords } from "../../../utils/capitalize.js";
import { uploadToCloudinary } from "../../../utils/cloudinaryHelpers.js";
import { nanoid } from "nanoid";

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
  const [existingEmail, existingPhone] = await Promise.all([
    userModel.findOne({ email }),
    userModel.findOne({ phone }),
  ]);

  if (existingEmail)
    return next(new Error("Email already exists", { cause: 401 }));
  if (existingPhone)
    return next(new Error("Phone number already exists", { cause: 401 }));

  const uploadedFiles = req.files || {};

  // Upload profile pic (if exists)
  const profilePicFile = uploadedFiles?.profilePic?.[0];
  const imageUrl = profilePicFile
    ? await uploadToCloudinary(
        profilePicFile,
        `${process.env.APP_NAME}/Users/${customId}/profilePic`,
        `${customId}_profilePic_${profilePicFile.originalname}`
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

  if (!user.isActive) {
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
