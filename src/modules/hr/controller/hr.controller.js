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
import translateAutoDetect from "../../../../languages/api/translateAutoDetect.js";
import { translateMultiLang } from "../../../../languages/api/translateMultiLang.js";
import userTokenModel from "../../../../DB/models/Firebase.model.js";
import permissionModel from "../../../../DB/models/Permission.model.js";

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
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
    documents: documentsData,
  } = req.body;

  const customId = nanoid();

  // 1. Translate fields
  const translatedName = await translateMultiLang(name);
  const translatedNationality = await translateMultiLang(nationality);
  const translatedAddress = await translateMultiLang(address);
  const translatedCity = await translateMultiLang(city);

  // 2. Handle duplicate checks in parallel
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

  // 3. Process profile image upload (if exists)
  const profilePicFile = uploadedFiles?.profilePic?.[0];
  const imageUrl = profilePicFile
    ? await uploadImageCloudinary(
        profilePicFile,
        `${process.env.APP_NAME}/Users/${customId}/profilePic`,
        `${customId}_profilePic`
      )
    : null;

  // 4. Process documents
  const processedDocuments = Array.isArray(documentsData)
    ? await Promise.all(
        documentsData.map(async (doc, i) => {
          const { title, start, end } = doc;
          if (!title || !start || !end) {
            throw new Error(
              "Each document must have title, start date, and end date"
            );
          }

          const translatedTitle = await translateMultiLang(title);
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
            title: translatedTitle,
            start: new Date(start),
            end: new Date(end),
            files: fileUploads,
          };
        })
      )
    : [];

  // 5. Create employee record
  const newEmployee = await userModel.create({
    name: translatedName,
    email,
    password: Hash({ plainText: password }),
    phone,
    age,
    dateOfBirth,
    gender,
    nationality: translatedNationality,
    address: translatedAddress,
    city: translatedCity,
    imageUrl,
    nationalId,
    swiftCode,
    IBAN,
    customId,
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
    documents: processedDocuments,
  });

  // 6. Update station with the new employee
  const existingStationWithEmployees = await stationModel.findOne({
    _id: station,
  });
  existingStationWithEmployees.employees.push(newEmployee._id);
  await existingStationWithEmployees.save();

  return res.status(201).json({
    message: getTranslation("Employee created successfully", req.language),
    result: newEmployee,
  });
});

//====================================================================================================================//
//log in

export const logIn = asyncHandler(async (req, res, next) => {
  const { phoneOrEmail, password, fcmToken } = req.body;

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
      "name password phone email station employeeCode status role imageUrl isActive"
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
      employeeCode: user.employeeCode,
      station: user.station,
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
  await userTokenModel.findOneAndUpdate(
    { userId: user._id },
    { fcmToken },
    { upsert: true, new: true }
  );
  const userData = user.toObject();
  userData.name = userData.name[req.language] || userData.name.en;
  // Respond to client
  return res.status(200).json({
    message: getTranslation("Welcome! Logged in successfully", req.language),
    authorization: { token },
    result: userData,
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
  const language = req.language || "en"; // Default to English if language not specified

  const existingEmployee = await userModel.findById(employeeId);
  if (!existingEmployee) {
    return next(new Error("Employee not found", { cause: 404 }));
  }

  const {
    name,
    email,
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
    station,
    salary,
    timeWork,
    joiningDate,
    contractDuration,
    residenceExpiryDate,
  } = req.body;

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
    return next(
      new Error("Email already exists", {
        cause: 409,
      })
    );
  if (existingPhone)
    return next(
      new Error("Phone number already exists", {
        cause: 409,
      })
    );

  // Translate name and address if provided
  const translatedName = name
    ? await translateMultiLang(capitalizeWords(name))
    : undefined;
  const translatedAddress = address
    ? await translateMultiLang(address)
    : undefined;
  const translatedNationality = nationality
    ? await translateMultiLang(nationality)
    : undefined;
  const translatedCity = city ? await translateMultiLang(city) : undefined;

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

  // Update employee fields
  const updatedFields = {
    name: translatedName || existingEmployee.name,
    email: email || existingEmployee.email,
    phone: phone || existingEmployee.phone,
    age: age || existingEmployee.age,
    dateOfBirth: dateOfBirth || existingEmployee.dateOfBirth,
    gender: gender || existingEmployee.gender,
    nationality: translatedNationality || existingEmployee.nationality,
    address: translatedAddress || existingEmployee.address,
    city: translatedCity || existingEmployee.city,
    nationalId: nationalId || existingEmployee.nationalId,
    swiftCode: swiftCode || existingEmployee.swiftCode,
    IBAN: IBAN || existingEmployee.IBAN,
    station: station || existingEmployee.station,
    salary: salary || existingEmployee.salary,
    timeWork: timeWork || existingEmployee.timeWork,
    joiningDate: joiningDate || existingEmployee.joiningDate,
    contractDuration: contractDuration || existingEmployee.contractDuration,
    residenceExpiryDate:
      residenceExpiryDate || existingEmployee.residenceExpiryDate,
  };

  Object.entries(updatedFields).forEach(([key, value]) => {
    existingEmployee[key] = value;
  });

  await existingEmployee.save();

  // Format the response according to the requested language
  const formattedResponse = {
    _id: existingEmployee._id,
    customId: existingEmployee.customId,
    name: existingEmployee.name?.[language],
    email: existingEmployee.email,
    phone: existingEmployee.phone,
    age: existingEmployee.age,
    dateOfBirth: existingEmployee.dateOfBirth,
    gender: existingEmployee.gender,
    nationality: existingEmployee.nationality?.[language],
    address: existingEmployee.address?.[language],
    city: existingEmployee.city?.[language],
    imageUrl: existingEmployee.imageUrl,
    nationalId: existingEmployee.nationalId,
    swiftCode: existingEmployee.swiftCode,
    IBAN: existingEmployee.IBAN,
    workFor: existingEmployee.workFor,
    station: existingEmployee.station,
    salary: existingEmployee.salary,
    timeWork: existingEmployee.timeWork,
    joiningDate: existingEmployee.joiningDate,
    contractDuration: existingEmployee.contractDuration,
    residenceExpiryDate: existingEmployee.residenceExpiryDate,
    documents: existingEmployee.documents?.map((doc) => ({
      title: doc.title?.[language],
      files: doc.files,
      start: doc.start,
      end: doc.end,
      _id: doc._id,
    })),
    role: existingEmployee.role,
    status: existingEmployee.status,
    availability: existingEmployee.availability,
    isActive: existingEmployee.isActive,
    isDeleted: existingEmployee.isDeleted,
    createdAt: existingEmployee.createdAt,
    updatedAt: existingEmployee.updatedAt,
    employeeCode: existingEmployee.employeeCode,
  };

  return res.status(200).json({
    status: "success",
    message: getTranslation("Employee updated successfully", language),
    result: formattedResponse,
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

    return res
      .status(200)
      .json({
        message: getTranslation("Employee deleted successfully", req.language),
      });
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
    message: getTranslation(
      "Document and associated files & folder deleted successfully",
      req.language
    ),
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
  const translatedTitle = await translateMultiLang(title);

  const newDocument = {
    title: translatedTitle,
    start: new Date(start),
    end: new Date(end),
    files: uploadedFiles,
  };

  user.documents.push(newDocument);
  await user.save();

  return res.status(201).json({
    message: getTranslation("Document added successfully", req.language),
    document: user.documents.at(-1),
  });
});
//====================================================================================================================//
//get all employees
export const getAllEmployees = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";

  // Step 1: Fetch all employees with basic fields
  const employees = await userModel.find(
    {},
    "name email imageUrl employeeCode timeWork"
  );

  // Step 2: Fetch all stations (only employees + stationName)
  const stations = await stationModel.find({}, "employees stationName").lean();

  // Step 3: Fetch all permission documents (assistant list + name)
  const permissions = await permissionModel
    .find({}, "assistant permissionName")
    .lean();

  // Step 4: Build response
  const translatedEmployees = await Promise.all(
    employees.map(async (emp) => {
      const empId = emp._id.toString();

      // Name Translation
      const employeeName = emp.name
        ? emp.name[targetLang] || emp.name.en
        : "N/A";

      // TimeWork Translation
      const { translatedText: employeeTimeWork } = await translateAutoDetect(
        emp.timeWork,
        req.language
      );

      // Station Lookup
      const station = stations.find((st) =>
        st.employees.some((id) => id.toString() === empId)
      );
      const stationName = station
        ? station.stationName?.[targetLang] || station.stationName?.en
        : "N/A";

      // Permissions Lookup
      const employeePermission = permissions.find((perm) =>
        perm.assistant.some((id) => id.toString() === empId)
      );
      const permissionName = employeePermission
        ? employeePermission.permissionName?.[targetLang] ||
          employeePermission.permissionName?.en
        : "Employee";

      return {
        ...emp.toObject(),
        name: employeeName,
        timeWork: employeeTimeWork,
        stationName,
        permissionName,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    count: translatedEmployees.length,
    result: translatedEmployees,
  });
});

//====================================================================================================================//
//get specific employee
export const getSpecificEmployee = asyncHandler(async (req, res, next) => {
  const targetLang = req.language || "en";
  const { employeeId } = req.params;

  const employee = await userModel
    .findById(employeeId)
    .populate("station", "stationName");

  if (!employee) {
    return next(new Error("Employee not found", { cause: 404 }));
  }

  // Translate stationName
  const stationName =
    employee.station?.stationName?.[targetLang] ||
    employee.station?.stationName?.en ||
    Object.values(employee.station?.stationName || {})[0] ||
    "N/A";

  // Destructure to remove `station`
  const {
    station, // exclude
    ...employeeData
  } = employee.toObject();

  const translatedEmployee = {
    ...employeeData,
    name: employee.name?.[targetLang] || employee.name?.en || "N/A",
    address: employee.address?.[targetLang] || employee.address?.en || "N/A",
    city: employee.city?.[targetLang] || employee.city?.en || "N/A",
    nationality:
      employee.nationality?.[targetLang] || employee.nationality?.en || "N/A",
    stationName, // only the translated station name
    documents:
      employee.documents?.map((doc) => ({
        ...doc.toObject(),
        title:
          doc.title?.[targetLang] ||
          doc.title?.en ||
          Object.values(doc.title)[0],
      })) || [],
  };

  if (employee.timeWork) {
    const { translatedText } = await translateAutoDetect(
      employee.timeWork,
      targetLang
    );
    translatedEmployee.timeWork = translatedText;
  }

  if (employee.workFor) {
    const { translatedText } = await translateAutoDetect(
      employee.workFor,
      targetLang
    );
    translatedEmployee.workFor = translatedText;
  }

  if (employee.gender) {
    const { translatedText } = await translateAutoDetect(
      employee.gender,
      targetLang
    );
    translatedEmployee.gender = translatedText;
  }

  return res.status(200).json({
    status: "success",
    result: translatedEmployee,
  });
});

//====================================================================================================================//
//user attendance
export const userAttendance = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const user = await userModel.findById(employeeId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const attendance = await attendanceModel.find(
    { user: employeeId },
    "date checkIn checkOut workingHours status"
  );

  const statusColorMap = {
    "On Time": "green",
    Late: "red",
    Absent: "warning",
    "Day Off": "blue",
  };

  const formattedAttendance = attendance.map((entry) => ({
    ...entry.toObject(),
    statusColor: statusColorMap[entry.status],
  }));

  return res.status(201).json({
    status: "success",
    attendanceDays: attendance.length,
    result: formattedAttendance,
  });
});

//====================================================================================================================//
//get job tasks
export const getJobTasks = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const targetLang = req.language || "en"; // Fallback to English

  // 1. Find user
  const user = await userModel.findById(employeeId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // 2. Fetch cleaning tasks with createdAt
  const cleaningTasksRaw = await cleaningTaskModel.find(
    { user: employeeId },
    "subTask date time location employeeName cleaningImages createdAt"
  );

  const cleaningTasks = await Promise.all(
    cleaningTasksRaw.map(async (task) => {
      const [employeeNameTranslation, subTaskTranslation] = await Promise.all([
        translateAutoDetect(task.employeeName, targetLang),
        translateAutoDetect(task.subTask, targetLang),
      ]);

      return {
        type: "cleaning",
        _id: task._id,
        subTask: subTaskTranslation.translatedText,
        date: task.date,
        time: task.time,
        location: task.location, // no translation
        employeeName: employeeNameTranslation.translatedText,
        cleaningImages: task.cleaningImages,
        createdAt: task.createdAt,
      };
    })
  );

  // 3. Fetch inventory tasks with createdAt
  const inventoryTasksRaw = await inventoryTaskModel
    .find(
      { user: employeeId },
      "subTask date time location employeeName inventoryImages pumps createdAt"
    )
    .populate({
      path: "pumps.pump",
      select: "pumpName",
    })
    .populate({
      path: "pumps.pistols.pistol",
      select: "gasolineName",
    });

  const inventoryTasks = await Promise.all(
    inventoryTasksRaw.map(async (task) => {
      const [employeeNameTranslation, subTaskTranslation] = await Promise.all([
        translateAutoDetect(task.employeeName, targetLang),
        translateAutoDetect(task.subTask, targetLang),
      ]);

      return {
        type: "inventory",
        _id: task._id,
        subTask: subTaskTranslation.translatedText,
        date: task.date,
        time: task.time,
        location: task.location, // no translation
        employeeName: employeeNameTranslation.translatedText,
        inventoryImages: task.inventoryImages,
        pumps: task.pumps.map((pumpItem) => ({
          _id: pumpItem._id,
          pump:
            typeof pumpItem.pump?.pumpName === "object"
              ? pumpItem.pump.pumpName[targetLang] ||
                pumpItem.pump.pumpName.en ||
                Object.values(pumpItem.pump.pumpName)[0]
              : pumpItem.pump?.pumpName || null,
          pistols: pumpItem.pistols.map((pistolItem) => ({
            _id: pistolItem._id,
            pistol:
              typeof pistolItem.pistol?.gasolineName === "object"
                ? pistolItem.pistol.gasolineName[targetLang] ||
                  pistolItem.pistol.gasolineName.en ||
                  Object.values(pistolItem.pistol.gasolineName)[0]
                : pistolItem.pistol?.gasolineName || null,
            counterNumber: pistolItem.counterNumber,
          })),
        })),
        createdAt: task.createdAt,
      };
    })
  );

  // 4. Merge and sort by createdAt descending
  const allTasks = [...cleaningTasks, ...inventoryTasks].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // 5. Send final response
  return res.status(200).json({
    status: "success",
    data: allTasks,
  });
});
