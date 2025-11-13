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
const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta del archivo actual como una URL (file://...)
const __dirname = path.dirname(__filename); // Obtiene el directorio del archivo actual

const DATA_PATH = path.join(__dirname, "data/gestures.json");
const MODEL_DIR = path.join(__dirname, "model");
const MODEL_SAVE_PATH = `file://${MODEL_DIR}`;
const MODEL_INFO_PATH = path.join(MODEL_DIR, "model_info.json");
const MODEL_PATH = path.join(MODEL_DIR, "model.json");

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
    const normalized = normalizeKeypoints(item.sequence);
    sequences.push(normalized);
    sequenceLabels.push(newLabels.indexOf(item.label));
  }

  // Creamos un TENSOR 3D: [muestras, pasos_de_tiempo, características]
  // Ejemplo: [27, 30, 1662]
  const X = tf.tensor3d(sequences, [
    sequences.length,
    SEQUENCE_LENGTH,
    FEATURES_PER_FRAME,
  ]);

  // Creamos el tensor de etiquetas (One-Hot)
  const y = tf.oneHot(tf.tensor1d(sequenceLabels, "int32"), numClasses);

  console.log("Datos de entrada (X) shape:", X.shape); // Debería ser [27, 30, 1662]
  console.log("Datos de salida (y) shape:", y.shape); // Debería ser [27, 3]

  // 3. Definir o Cargar el Modelo
  let model;
  if (fs.existsSync(MODEL_PATH)) {
    console.log("Cargando modelo LSTM existente...");
    const oldModel = await tf.loadLayersModel(`${MODEL_SAVE_PATH}/model.json`);
    const oldNumClasses =
      oldModel.layers[oldModel.layers.length - 1].outputShape[1];

    if (oldNumClasses === numClasses) {
      // El número de gestos no cambió, podemos continuar entrenando
      console.log("El número de clases no cambió. Continuando entrenamiento.");
      model = oldModel;
    } else {
      // ¡El número de clases cambió! (Tu error)
      // Debemos recrear el modelo y transferir los pesos.
      console.warn(
        `¡El número de clases cambió de ${oldNumClasses} a ${numClasses}!`
      );
      console.warn("Reconstruyendo modelo LSTM y transfiriendo pesos...");

      // 1. Crea la NUEVA arquitectura
      model = createLSTMModel(numClasses);

      // 2. Copia los pesos de las capas comunes
      for (let i = 0; i < oldModel.layers.length - 1; i++) {
        model.layers[i].setWeights(oldModel.layers[i].getWeights());
      }
      console.log("Pesos transferidos a la nueva arquitectura.");
    }
  } else {
    // Si no existe, créalo
    console.log("Creando un modelo LSTM nuevo...");
    model = createLSTMModel(numClasses);
  }

  model.summary();

  // 4. Entrenar el Modelo
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });


  const earlyStopping = tf.callbacks.earlyStopping({
    monitor: 'val_loss',
    patience: 10,
  });

  const saveBestModel = new SaveBestModel(MODEL_SAVE_PATH);

  console.log("Entrenando...");
  await model.fit(X, y, {
    epochs: 100, 
    batchSize: 16, 
    shuffle: true,
    validationSplit: 0.2, 
    callbacks: [earlyStopping, saveBestModel] 
  });
  /* await model.fit(X, y, {
    epochs: 100, // Aumenta esto si tienes más datos
    batchSize: 8,
    shuffle: true,
    validationSplit: 0.2, // Usar 20% de los datos para validación
    callbacks: tf.callbacks.earlyStopping({
      monitor: "val_loss",
      patience: 10, // Más paciencia antes de detenerse
      saveBestOnly: true,
      restoreBestWeights: true // ¡Guarda el mejor modelo!
    }),
  }); */

  // 5. Guardar Modelo y Etiquetas
  await model.save(MODEL_SAVE_PATH);
  fs.writeFileSync(MODEL_INFO_PATH, JSON.stringify({ labels: newLabels }));

  console.log(`* Modelo guardado en ${MODEL_SAVE_PATH}`);
  console.log(`* Etiquetas guardadas en ${MODEL_INFO_PATH}`);
}


// --- Función Helper para crear el modelo LSTM ---
function createLSTMModel(numClasses) {
  const model = tf.sequential();

  // Capa LSTM. 
  // inputShape: [pasos_de_tiempo, características] -> [30, 1662]
  model.add(
    tf.layers.lstm({
      units: 64, // 64 neuronas de memoria
      inputShape: [SEQUENCE_LENGTH, FEATURES_PER_FRAME],
      returnSequences: false, // Solo nos importa la salida del final
    })
  );
  model.add(tf.layers.dropout({ rate: 0.5 }));

  // Capa Densa normal para clasificar
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.5 }));

  // Capa de salida
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));

  return model;
}

// Ejecutar el entrenamiento
trainModel().catch(console.error);











class SaveBestModel extends tf.Callback {
  constructor(savePath) {
    super();
    this.savePath = savePath;
    this.bestValLoss = Infinity; // Empezamos con el peor error posible
  }

  async onEpochEnd(epoch, logs) {
    if (logs.val_loss == null) {
      // Pasa si no hay datos de validación
      return;
    }

    // Comprueba si el error de validación actual es el mejor
    if (logs.val_loss < this.bestValLoss) {
      this.bestValLoss = logs.val_loss;
      // ¡Es el mejor! Guarda el modelo
      await this.model.save(this.savePath);
      console.log(
        `\nEpoch ${epoch + 1}: val_loss mejoró a ${this.bestValLoss.toFixed(
          4
        )}, guardando modelo en ${this.savePath}`
      );
    }
  }
}