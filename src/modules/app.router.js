import cookieParser from "cookie-parser";
import connectDB from "../../DB/connection.js";
import { glopalErrHandling } from "../utils/errorHandling.js";
import { languageMiddleware } from "../middlewares/language.middleware.js";
import { AppError } from "../utils/appError.js";
import hrRouter from "./hr/hr.router.js";
import stationRouter from "./station/station.router.js";
import employeeRouter from "./employee/employee.router.js";
import taskRouter from "./jobtask/jobTask.router.js";
import contactRouter from "./contact/contact.router.js";
import messageRouter from "./message/message.router.js"
import groupRouter from "./group/group.router.js"
import todoRouter from './todo/todo.router.js'
import supplierRouter from './supplier/supplier.router.js'

const initApp = (app, express) => {
  // Built-in Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Custom Middlewares
  app.use(languageMiddleware);

  // Routes
  app.use("/hr", hrRouter);
  app.use("/station", stationRouter);
  app.use("/employee", employeeRouter);
  app.use("/task", taskRouter);
  app.use("/contact", contactRouter);
  app.use("/message", messageRouter);
  app.use("/group", groupRouter);
  app.use("/todo", todoRouter);
  app.use("/supplier",supplierRouter);


 
  // Catch-all for undefined routes
  app.use((req, res, next) => {
    next(
      new AppError("Not Found", 404, {
        method: req.method,
        url: req.originalUrl,
      })
    );
  });

  // Global Error Handler
  app.use(glopalErrHandling);

  // Connect to DB
  connectDB();
};

export default initApp;
