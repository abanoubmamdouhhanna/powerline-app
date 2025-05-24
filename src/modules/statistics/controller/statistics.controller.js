import gasolineModel from "../../../../DB/models/GasolinePrice.model.js";
import stationModel from "../../../../DB/models/Station.model.js";
import toDoModel from "../../../../DB/models/ToDo.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//tasks statistics
export const taskstats = asyncHandler(async (req, res, next) => {
  const statuses = ["Not Started", "To Do", "Completed"];

  const allTasks = await toDoModel.find({ status: { $in: statuses } });

  const statusCount = {
    notStarted: 0,
    TODO: 0,
    completed: 0,
  };

  allTasks.forEach((task) => {
    if (task.status === "Not Started") statusCount.notStarted++;
    else if (task.status === "To Do") statusCount.TODO++;
    else if (task.status === "Completed") statusCount.completed++;
  });

  const total = allTasks.length;

  return res.status(200).json({
    ...statusCount,
    total,
  });
});
//====================================================================================================================//
//employee statistics
export const employeeStats = asyncHandler(async (req, res) => {
  const stats = await userModel.aggregate([
    {
      $match: {
        isDeleted: false,
        $or: [
          { role: "employee" },
          { role: "admin", workFor: "company" },
          { role: "assistant", workFor: "company" },
        ],
      },
    },
    {
      $group: {
        _id: {
          role: "$role",
          workFor: "$workFor",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Initialize counters
  const counts = {
    totalEmployees: 0,
    employees: {
      stations: 0,
      company: 0,
    },
    companyAdmins: 0,
    companyAssistants: 0,
  };

  let total = 0;

  stats.forEach(({ _id: { role, workFor }, count }) => {
    total += count;

    if (role === "employee") {
      counts.totalEmployees += count;
      if (workFor === "stations") counts.employees.stations = count;
      if (workFor === "company") counts.employees.company = count;
    }

    if (role === "admin" && workFor === "company") {
      counts.companyAdmins = count;
    }

    if (role === "assistant" && workFor === "company") {
      counts.companyAssistants = count;
    }
  });

  return res.status(200).json({
    total,
    ...counts,
  });
});
//====================================================================================================================//
//stations statistics
export const stationsStats = asyncHandler(async (req, res, next) => {
  const stats = await stationModel.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $project: {
        stationName: 1,
        employeesCount: { $size: { $ifNull: ["$employees", []] } },
        noOfPumps: 1,
        noOfPistol: 1,
        noOfGreenPistol: 1,
        noOfRedPistol: 1,
        noOfDieselPistol: 1,
        storesCount: { $size: { $ifNull: ["$stores", []] } },
        documentsCount: { $size: { $ifNull: ["$documents", []] } },
      },
    },
    {
      $group: {
        _id: null,
        totalStations: { $sum: 1 },
        totalPumps: { $sum: "$noOfPumps" },
        totalPistols: { $sum: "$noOfPistol" },
        totalGreenPistols: { $sum: "$noOfGreenPistol" },
        totalRedPistols: { $sum: "$noOfRedPistol" },
        totalDieselPistols: { $sum: "$noOfDieselPistol" },
        totalStores: { $sum: "$storesCount" },
        stationsWithEmployees: {
          $sum: {
            $cond: [{ $gt: ["$employeesCount", 0] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalStations: 1,
        totalPumps: 1,
        totalPistols: 1,
        totalGreenPistols: 1,
        totalRedPistols: 1,
        totalDieselPistols: 1,
        totalStores: 1,
        stationsWithEmployees: 1,
      },
    },
  ]);

  res.status(200).json(stats[0] || {});
});
//====================================================================================================================//
//get Station Full Stats
export const getStationFullStats = asyncHandler(async (req, res, next) => {
  const stationId = req.user.station;
  const targetLang = req.language || "en";

  // 🔸 Step 1: Station Statistics
  const stationStats = await stationModel.aggregate([
    {
      $match: {
        _id: stationId,
        isDeleted: false,
      },
    },
    {
      $project: {
        _id: 0,
        stationWorkers: { $size: { $ifNull: ["$employees", []] } },
        noOfPumps: 1,
        noOfGreenPistol: { $ifNull: ["$noOfGreenPistol", 0] },
        noOfRedPistol: { $ifNull: ["$noOfRedPistol", 0] },
        noOfDieselPistol: { $ifNull: ["$noOfDieselPistol", 0] },
        totalPistols: { $ifNull: ["$noOfPistol", 0] },
      },
    },
  ]);

  const stationData = stationStats[0] || {
    stationWorkers: 0,
    noOfPumps: 0,
    noOfGreenPistol: 0,
    noOfRedPistol: 0,
    noOfDieselPistol: 0,
    totalPistols: 0,
  };

  // 🔸 Step 2: Gasoline Prices
  const gasolinePrices = await gasolineModel
    .find({ station: stationId })
    .populate({
      path: "station",
      select: "stationName",
    });

  if (!gasolinePrices || gasolinePrices.length === 0) {
    return next(
      new Error("No gasoline prices found for this station", { cause: 404 })
    );
  }

  const translatedPrices = gasolinePrices.map((price) => ({
    station:
      price.station.stationName?.[targetLang] ||
      price.station.stationName?.en ||
      Object.values(price.station.stationName)[0],
    redPrice: price.redPrice,
    greenPrice: price.greenPrice,
    dieselPrice: price.dieselPrice,
  }));

  // 🔸 Final Response
  res.status(200).json({
    status: "success",
    stationStats: stationData,
    gasolinePrices: translatedPrices,
  });
});
