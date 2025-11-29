
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SEQUENCE_LENGTH, FEATURES_PER_FRAME } from "./normalizeKeypoints.js"; // <-- ¡Importa!

// --- CONFIGURACIÓN DE ARCHIVOS ---

const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta del archivo actual como una URL (file://...)
const __dirname = path.dirname(__filename); // Obtiene el directorio del archivo actual

const tfjsNodePath = path.join(__dirname, 'node_modules', '@tensorflow', 'tfjs-node', 'deps', 'lib');
  process.env.PATH = `${tfjsNodePath};${process.env.PATH}`; // Añade la ruta al inicio del PATH para que el cargador de DLLs la encuentre primero

// Verifica que estemos en Windows y que la ruta no esté ya en el PATH
if (process.platform === 'win32' && process.env.PATH && !process.env.PATH.includes(tfjsNodePath)) {
  process.env.PATH = `${tfjsNodePath};${process.env.PATH}`; // Añade la ruta al inicio del PATH para que el cargador de DLLs la encuentre primero
  console.log('Ruta de TensorFlow DLLs añadida temporalmente al PATH.');
}

import * as tf from '@tensorflow/tfjs-node';
import authRoutes from "./routes/auth.route.js";
import gesturesRoutes from "./routes/gestures.route.js";
import statsRoutes from "./routes/stats.route.js";
import educatorRoutes from "./routes/educator.route.js";
import adminRoutes from "./routes/admin.route.js";
// ---------------------------------

dotenv.config();
const app = express();

// --- CARGAR EL MODELO ---
let model = null;
let modelInfo = null;
export const MODEL_PATH = path.join(__dirname, "model/model.json");
const INFO_PATH = path.join(__dirname, "model/model_info.json");

export async function loadModel() {
  if (!fs.existsSync(MODEL_PATH) || !fs.existsSync(INFO_PATH)) {
    console.warn("ADVERTENCIA: No se encontró el modelo entrenado. Ejecuta 'node backend/train.js' primero.");
    return;
  }
  
  try {
    model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
    const infoData = fs.readFileSync(INFO_PATH, 'utf8');
    modelInfo = JSON.parse(infoData);
    
    // Calentar el modelo
    tf.tidy(() => {
        model.predict(tf.zeros([1, SEQUENCE_LENGTH, FEATURES_PER_FRAME]));
    });

    console.log(`✅ Modelo y ${modelInfo.labels.length} etiquetas cargadas correctamente.`);
  } catch (err) {
    console.error("Error al cargar el modelo:", err);
  }
}
// -----------------------

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Pasar el modelo a las rutas
app.use((req, res, next) => {
  req.model = model;
  req.modelInfo = modelInfo;
  next();
});

app.use("/api", authRoutes); // /api/login, /api/register
app.use("/api/gestures", gesturesRoutes); // /api/gestures/collect, /api/gestures/predict
app.use("/api/stats", statsRoutes); // /api/stats/update, /api/stats/dashboard
app.use("/api/educator", educatorRoutes); // /api/educator/students, /api/educator/reports
app.use("/api/admin", adminRoutes); // /

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
    // Iniciar el servidor DESPUÉS de cargar el modelo
    loadModel().then(() => {
      app.listen(PORT, '0.0.0.0', () => console.log(`Servidor escuchando en el puerto ${PORT}`));
    });
  })
  .catch(err => console.error("Error de conexión:", err));
