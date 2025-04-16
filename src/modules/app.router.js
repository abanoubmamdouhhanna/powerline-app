import cookieParser from "cookie-parser";
import connectDB from "../../DB/connection.js";
import { glopalErrHandling } from "../utils/errorHandling.js";
import { languageMiddleware } from "../middlewares/language.middleware.js";
import { AppError } from "../utils/appError.js";
import hrRouter from "./hr/hr.router.js"

const initApp = (app, express) => {
  
  // Built-in Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Custom Middlewares
  app.use(languageMiddleware);

  // Routes
  app.use("/hr", hrRouter);


  // Catch-all for undefined routes
  app.use((req, res, next) => {
    next(new AppError("Not Found", 404, { method: req.method, url: req.originalUrl }));
 }); 

  // Global Error Handler
  app.use(glopalErrHandling);

  // Connect to DB
  connectDB();
};

export default initApp;
