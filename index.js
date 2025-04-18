import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import initApp from "./src/modules/app.router.js";
import { app, server } from "./services/socket.io.js";
import cors from "cors"
import { cronApsent } from "./src/utils/absnetCron.js";

// Set directory dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "./config/.env") });
const port = process.env.PORT;
app.use(cors());

cronApsent()
initApp(app, express);

server.listen(port, () => {
  console.log(`Server is running on port.......${port}`);
});
