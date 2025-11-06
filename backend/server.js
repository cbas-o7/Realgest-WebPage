import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

import authRoutes from "./routes/auth.route.js";
import gesturesRoutes from "./routes/gestures.route.js";

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Servir modelo estáticamente
//pp.use('/model', express.static(path.join(__dirname, 'model')));


app.use("/api", authRoutes);
app.use("/api/gestures", gesturesRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
    app.listen(3000, () => console.log("Servidor en http://localhost:3000"));
  })
  .catch(err => console.error("Error de conexión:", err));
