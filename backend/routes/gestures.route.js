import express from "express";
import * as tf from "@tensorflow/tfjs-node";
//import "@tensorflow/tfjs-backend-cpu";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  normalizeKeypoints,
  SEQUENCE_LENGTH,
  FEATURES_PER_FRAME,
} from "../normalizeKeypoints.js";

const router = express.Router();

// 1. Obtiene la ruta absoluta del archivo actual (script.js)
const __filename = fileURLToPath(import.meta.url);
// 2. Obtiene el directorio del archivo actual (backend/routes)
const __dirname = path.dirname(__filename);
// 3. Usa '..' en path.join para navegar hacia atrás
const DATA_PATH = path.join(__dirname, '..', 'data', 'gestures.json');


router.post("/collect", async (req, res) => {
  try {
    const { label, sequence } = req.body;

    if (!label || !sequence || sequence.length === 0) {
      return res.status(400).json({ message: "Faltan la etiqueta o la secuencia" });
    }

    // Asegurarse que el directorio 'data' exista
    const dataDir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Leer datos existentes
    let data = [];
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      data = JSON.parse(fileData);
    }

    // Agregar nueva secuencia
    data.push({ label, sequence });

    // Guardar datos
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

    console.log(`📥 Secuencia guardada para: ${label}. Total de secuencias: ${data.length}`);
    res.status(201).json({ message: "Secuencia guardada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// Registro
router.post("/predict", async (req, res) => {
  const { model, modelInfo } = req; // Obtener modelo cargado desde server.js
  const { sequence } = req.body;

  if (!model || !modelInfo) {
    return res.status(503).json({ message: "El modelo no está cargado" });
  }
  if (!sequence || sequence.length === 0) {
    return res.status(400).json({ message: "Falta la secuencia de fotogramas" });
  }
  
  try {
    let prediction = "---";
    let confidence = 0;
    let penecito;

    tf.tidy(() => {
      // 1. Normalizar la secuencia recibida
      const input = normalizeKeypoints(sequence);
      
      const tensor = tf.tensor3d([input], [1, SEQUENCE_LENGTH, FEATURES_PER_FRAME]);

      // 2. Realizar la predicción
      const result = model.predict(tensor);
      const predictionData = result.dataSync();
      
      // 3. Obtener la predicción con mayor confianza
      const maxProbIndex = result.argMax(1).dataSync()[0];
      confidence = predictionData[maxProbIndex];

      if (confidence > 0.7) { // Umbral de confianza
        prediction = modelInfo.labels[maxProbIndex];
        penecito = true ? " ":`{${predictionData}, ${result}}`
      }
    });

    console.log(`Predicción: ${prediction} (Confianza: ${confidence.toFixed(2)})  ${penecito}`);
    res.status(200).json({ prediction, confidence });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

export default router;