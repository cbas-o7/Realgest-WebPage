import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  normalizeKeypoints,
  SEQUENCE_LENGTH,
  FEATURES_PER_FRAME,
} from "./normalizeKeypoints.js";

// --- Constantes del Modelo ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "data/gestures.json");
const MODEL_DIR = path.join(__dirname, "model");
const MODEL_SAVE_PATH = `file://${MODEL_DIR}`;
const MODEL_INFO_PATH = path.join(MODEL_DIR, "model_info.json");
const MODEL_PATH = path.join(MODEL_DIR, "model.json");
const STATS_PATH = path.join(MODEL_DIR, "training_stats.json"); // Archivo de estadísticas

// --- Callback Personalizado para Guardar Mejor Modelo ---
class SaveBestModel extends tf.Callback {
  constructor(savePath) {
    super();
    this.savePath = savePath;
    this.bestValLoss = Infinity;
  }

  async onEpochEnd(epoch, logs) {
    if (logs.val_loss == null) return;
    if (logs.val_loss < this.bestValLoss) {
      this.bestValLoss = logs.val_loss;
      await this.model.save(this.savePath);
      console.log(
        `\nEpoch ${epoch + 1}: val_loss mejoró a ${this.bestValLoss.toFixed(
          4
        )}, guardando modelo.`
      );
    }
  }
}

// --- Función Helper para crear el modelo LSTM ---
function createLSTMModel(numClasses) {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: 64,
      inputShape: [SEQUENCE_LENGTH, FEATURES_PER_FRAME],
      returnSequences: false,
    })
  );
  //model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));
  return model;
}

// --- Función Principal de Entrenamiento ---
async function trainModel() {
  console.log("Iniciando entrenamiento con modelo LSTM...");

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

  const newLabels = [...new Set(data.map((item) => item.label))];
  console.log("Gestos a entrenar:", newLabels);
  const numClasses = newLabels.length;

  // 2. Preprocesar Datos
  const sequences = [];
  const sequenceLabels = [];

  for (const item of data) {
    sequences.push(normalizeKeypoints(item.sequence));
    sequenceLabels.push(newLabels.indexOf(item.label));
  }

  const X = tf.tensor3d(sequences, [
    sequences.length,
    SEQUENCE_LENGTH,
    FEATURES_PER_FRAME,
  ]);
  const y = tf.oneHot(tf.tensor1d(sequenceLabels, "int32"), numClasses);

  console.log("Datos de entrada (X) shape:", X.shape);
  console.log("Datos de salida (y) shape:", y.shape);

  // 3. Definir o Cargar el Modelo
  let model;

  // Creamos siempre una arquitectura nueva para evitar conflictos de nombres
  model = createLSTMModel(numClasses);

  if (fs.existsSync(MODEL_PATH)) {
    console.log("Cargando modelo existente para transferir aprendizaje...");
    try {
      const oldModel = await tf.loadLayersModel(
        `${MODEL_SAVE_PATH}/model.json`
      );
      const oldNumClasses =
        oldModel.layers[oldModel.layers.length - 1].outputShape[1];

      if (oldNumClasses === numClasses) {
        // Si las clases coinciden, intentamos cargar los pesos directamente
        console.log("El número de clases coincide. Copiando pesos...");
        // Copiamos capa por capa para mayor seguridad
        for (
          let i = 0;
          i < Math.min(model.layers.length, oldModel.layers.length);
          i++
        ) {
          const weights = oldModel.layers[i].getWeights();
          if (weights.length > 0) {
            // Solo copiamos si hay pesos (evita error en Dropout)
            model.layers[i].setWeights(weights);
          }
        }
      } else {
        console.log(
          `Clases cambiaron (${oldNumClasses} -> ${numClasses}). Reutilizando capas base.`
        );
        // Copiamos todo MENOS la última capa
        for (let i = 0; i < model.layers.length - 1; i++) {
          const weights = oldModel.layers[i].getWeights();
          if (weights.length > 0) {
            model.layers[i].setWeights(weights);
          }
        }
      }
      console.log("✅ Transferencia de pesos completada.");
    } catch (err) {
      console.warn(
        " No se pudieron transferir los pesos antiguos. Se entrenará desde cero."
      );
      console.warn("Error:", err.message);
      // El script continúa con el modelo nuevo "en blanco", no se detiene.
    }
  } else {
    console.log("Creando un modelo LSTM nuevo desde cero...");
  }

  model.summary();

  // 4. Entrenar el Modelo
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  const earlyStopping = tf.callbacks.earlyStopping({
    monitor: "val_loss",
    patience: 10,
  });
  const saveBestModel = new SaveBestModel(MODEL_SAVE_PATH);

  console.log("Entrenando...");
  const history = await model.fit(X, y, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    validationSplit: 0.2,
    callbacks: [earlyStopping, saveBestModel],
  });

  // 5. Guardar Etiquetas y Estadísticas
  fs.writeFileSync(MODEL_INFO_PATH, JSON.stringify({ labels: newLabels }));

  // Guardar estadísticas finales

  const valLosses = history.history.val_loss;
  const bestEpochIndex = valLosses.indexOf(Math.min(...valLosses));

  // Recuperamos las métricas de ESE índice específico
  const bestValAcc = history.history.val_acc[bestEpochIndex];
  const bestLoss = valLosses[bestEpochIndex];

  const stats = {
    accuracy: bestValAcc,
    loss: bestLoss,
    bestEpoch: bestEpochIndex + 1, // +1 porque los índices empiezan en 0
    timestamp: new Date().toISOString(),
    samples: data.length,
    classes: numClasses,
  };

  fs.writeFileSync(STATS_PATH, JSON.stringify(stats));

  console.log(` Entrenamiento completado.`);
  console.log(` Mejores estadísticas (Epoch ${stats.bestEpoch}): val_acc = ${bestValAcc.toFixed(4)}`);
  console.log(` Etiquetas guardadas en ${MODEL_INFO_PATH}`);
}

// Ejecutar el entrenamiento
trainModel().catch(console.error);
