import express from "express";
import * as tf from "@tensorflow/tfjs-node";
//import "@tensorflow/tfjs-backend-cpu";
import fs from "fs";
import path, { normalize } from "path";
import { fileURLToPath } from "url";
import { normalizeKeypoints } from "../normalizeKeypoints.js";

const router = express.Router();

const DATA_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "data/gestures.json");

// --- Constantes para predicción ---
const SEQUENCE_LENGTH = 30; // Debe coincidir con el de train.js
let sequenceBuffer = []; // Búfer para los fotogramas
let lastPrediction = "---";
// ----------------------------------

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
/* 
function normalizeKeypoints(sequence) {
  // Constantes esperadas (ajusta si usas menos landmarks)
  const POSE_LANDMARKS = 33;
  const FACE_LANDMARKS = 468;
  const HAND_LANDMARKS = 21;

  const POSE_DIM = 4;   // x,y,z,visibility
  const FACE_DIM = 3;   // x,y,z
  const HAND_DIM = 3;   // x,y,z

  const FEATURES_PER_FRAME = POSE_LANDMARKS * POSE_DIM +
                             FACE_LANDMARKS * FACE_DIM +
                             HAND_LANDMARKS * HAND_DIM * 2; // left + right

  const normalizedFrames = [];

  for (const frame of sequence) {
    const frameFeatures = [];

    // Pose (33 landmarks * 4)
    for (let i = 0; i < POSE_LANDMARKS; i++) {
      const p = (frame.pose && frame.pose[i]) || {};
      frameFeatures.push(
        Number(p.x || 0),
        Number(p.y || 0),
        Number(p.z || 0),
        Number(p.visibility || 0)
      );
    }

    // Face (468 landmarks * 3)
    for (let i = 0; i < FACE_LANDMARKS; i++) {
      const f = (frame.face && frame.face[i]) || {};
      frameFeatures.push(
        Number(f.x || 0),
        Number(f.y || 0),
        Number(f.z || 0)
      );
    }

    // Left hand (21 * 3)
    for (let i = 0; i < HAND_LANDMARKS; i++) {
      const h = (frame.leftHand && frame.leftHand[i]) || {};
      frameFeatures.push(
        Number(h.x || 0),
        Number(h.y || 0),
        Number(h.z || 0)
      );
    }

    // Right hand (21 * 3)
    for (let i = 0; i < HAND_LANDMARKS; i++) {
      const h = (frame.rightHand && frame.rightHand[i]) || {};
      frameFeatures.push(
        Number(h.x || 0),
        Number(h.y || 0),
        Number(h.z || 0)
      );
    }

    // Asegurar longitud por si algo inesperado pasó
    if (frameFeatures.length !== FEATURES_PER_FRAME) {
      // rellenar/recortar para que siempre coincida
      if (frameFeatures.length < FEATURES_PER_FRAME) {
        frameFeatures.push(...Array(FEATURES_PER_FRAME - frameFeatures.length).fill(0));
      } else {
        frameFeatures.length = FEATURES_PER_FRAME;
      }
    }

    normalizedFrames.push(frameFeatures);
  }
  
  // Aplanar la secuencia de fotogramas en un solo vector por ahora
  // Un enfoque más avanzado usaría relleno (padding) y una LSTM.
  // Pero para empezar, aplanemos los primeros SEQUENCE_LENGTH fotogramas.
  
  let flatSequence = [];
  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    if (i < normalizedFrames.length) {
      flatSequence.push(...normalizedFrames[i]);
    } else {
      flatSequence.push(...Array(FEATURES_PER_FRAME).fill(0));
    }
  }

  // Truncar si es muy larga
  if (flatSequence.length > SEQUENCE_LENGTH * 1629) {
     flatSequence = flatSequence.slice(0, SEQUENCE_LENGTH * 1629);
  }

  // Corrección: Asegurarnos de que el relleno se haga si el primer frame no existe
  if (normalizedFrames.length === 0) {
      const keypointsInFrame = 1629; // Número de características por fotograma
      flatSequence = Array(SEQUENCE_LENGTH * keypointsInFrame).fill(0);
  }


  return flatSequence;
} */

// Registro
router.post("/landmarks", async (req, res) => {
  const SEQUENCE_LENGTH = 30;
  const { model, modelInfo } = req; // Obtener modelo cargado desde server.js
  let prediction = null;
  
  try {
    const data = req.body;
    
    // 1. Agregar fotograma al búfer
    const frameLandmarks = {
      pose: data.pose || [],
      face: data.face || [],
      leftHand: data.leftHand || [],
      rightHand: data.rightHand || [],
    };
    sequenceBuffer.push(frameLandmarks);

    // 2. Mantener el búfer al tamaño de la secuencia
    if (sequenceBuffer.length > SEQUENCE_LENGTH) {
      sequenceBuffer.shift(); // Elimina el fotograma más antiguo
    }

    // 3. Predecir solo si el modelo está cargado y el búfer está lleno
    if (model && modelInfo && sequenceBuffer.length === SEQUENCE_LENGTH) {
      tf.tidy(() => {
        // 4. Normalizar la secuencia del búfer
        
        const input = normalizeKeypoints(sequenceBuffer);
        const tensor = tf.tensor2d([input], [1, input.length]);

        // 5. Realizar la predicción
        const result = model.predict(tensor);
        const predictionData = result.dataSync();
        
        // 6. Obtener la predicción con mayor confianza
        const maxProbIndex = result.argMax(1).dataSync()[0];
        const maxProb = predictionData[maxProbIndex];

        // Umbral de confianza
        if (maxProb > 0.7) { 
          prediction = modelInfo.labels[maxProbIndex];
          
          // Lógica para evitar spam (solo enviar si cambia la predicción)
          if (prediction !== lastPrediction) {
            console.log(`🤖 Predicción: ${prediction} (Confianza: ${maxProb.toFixed(2)})`);
            lastPrediction = prediction;
          } else {
            prediction = null; // No enviar si es la misma que la anterior
          }
        } else {
          lastPrediction = "---"; // Resetear si no hay confianza
        }
      });
    }

    res.status(200).json({ 
      message: "Landmarks recibidos", 
      prediction: prediction // Enviar la nueva predicción (o null)
    });
    
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

export default router;