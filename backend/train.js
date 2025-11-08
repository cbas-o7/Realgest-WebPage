
import * as tf from "@tensorflow/tfjs-node";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- Constantes del Modelo ---
const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta del archivo actual como una URL (file://...)
const __dirname = path.dirname(__filename); // Obtiene el directorio del archivo actual

const SEQUENCE_LENGTH = 30; // 30 fotogramas por gesto
const DATA_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "data/gestures.json");
const MODEL_SAVE_PATH = "file://./model";

// --- Normalización de Keypoints (¡MUY IMPORTANTE!) ---
// Esta función es crucial. Un modelo no puede aprender de coordenadas
// absolutas (x, y, z). Necesitamos normalizarlas.
// Esta es una normalización BÁSICA.
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
}

// --- Función Principal de Entrenamiento ---
async function trainModel() {
  console.log("Iniciando entrenamiento...");

  // 1. Cargar Datos
  if (!fs.existsSync(DATA_PATH)) {
    console.error("No se encontró 'gestures.json'. ¡Recolecta datos primero!");
    return;
  }
  const fileData = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(fileData);

  if (data.length === 0) {
    console.error("No hay datos en 'gestures.json'. ¡Recolecta datos primero!");
    return;
  }
  
  const labels = [...new Set(data.map(item => item.label))];
  console.log("Gestos a entrenar:", labels);

  // 2. Preprocesar Datos
  const sequences = [];
  const sequenceLabels = [];

  for (const item of data) {
    const normalized = normalizeKeypoints(item.sequence);
    sequences.push(normalized);
    sequenceLabels.push(labels.indexOf(item.label));
  }

  const numFeatures = sequences[0].length; // (1629 features * 30 frames)
  const numClasses = labels.length;

  const X = tf.tensor2d(sequences, [sequences.length, numFeatures]);
  const y = tf.oneHot(tf.tensor1d(sequenceLabels, 'int32'), numClasses);

  X.print();
  y.print();

  // 3. Definir el Modelo
  // Usaremos un modelo simple (Red Neuronal Densa) ya que aplanamos los datos.
  // Un modelo LSTM sería mejor para secuencias, pero requiere más preprocesamiento.
  const model = tf.sequential();
  
  // Capa de entrada
  model.add(tf.layers.dense({
    inputShape: [numFeatures],
    units: 128,
    activation: "relu",
  }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  
  // Capa oculta
  model.add(tf.layers.dense({
    units: 64,
    activation: "relu",
  }));
  model.add(tf.layers.dropout({ rate: 0.5 }));

  // Capa de salida
  model.add(tf.layers.dense({
    units: numClasses,
    activation: "softmax",
  }));

  model.summary();

  // 4. Entrenar el Modelo
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  console.log("Entrenando...");
  await model.fit(X, y, {
    epochs: 50, // Aumenta esto si tienes más datos
    batchSize: 16,
    shuffle: true,
    validationSplit: 0.1, // Usar 10% de los datos para validación
    callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 })
  });

  // 5. Guardar Modelo
  await model.save(MODEL_SAVE_PATH);
  
  // 6. Guardar las etiquetas (labels)
  const modelInfo = { labels };
  fs.writeFileSync(path.join(__dirname, "model", "model_info.json"), JSON.stringify(modelInfo));

  console.log(`✅ Modelo guardado en ${MODEL_SAVE_PATH}`);
  console.log(`✅ Etiquetas guardadas en backend/model/model_info.json`);
}

// Ejecutar el entrenamiento
trainModel();