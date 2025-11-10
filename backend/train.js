
import * as tf from "@tensorflow/tfjs-node";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeKeypoints } from "./normalizeKeypoints.js";

// --- Constantes del Modelo ---
const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta del archivo actual como una URL (file://...)
const __dirname = path.dirname(__filename); // Obtiene el directorio del archivo actual

const SEQUENCE_LENGTH = 30; // 30 fotogramas por gesto

const DATA_PATH = path.join(__dirname, "data/gestures.json");
const MODEL_DIR = path.join(__dirname, "model");
const MODEL_SAVE_PATH = `file://${MODEL_DIR}`;
const MODEL_INFO_PATH = path.join(MODEL_DIR, "model_info.json");
const MODEL_PATH = path.join(MODEL_DIR, "model.json");


// --- Función Principal de Entrenamiento ---
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
  
  const newLabels = [...new Set(data.map(item => item.label))];
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

  const numFeatures = sequences[0].length;
  const X = tf.tensor2d(sequences, [sequences.length, numFeatures]);
  const y = tf.oneHot(tf.tensor1d(sequenceLabels, 'int32'), numClasses);
  
  console.log("Datos de entrada (X) shape:", X.shape);
  console.log("Datos de salida (y) shape:", y.shape);


  // 3. Definir o Cargar el Modelo
  let model;
  if (fs.existsSync(MODEL_PATH)) {
    console.log("Cargando modelo existente...");
    const oldModel = await tf.loadLayersModel(`${MODEL_SAVE_PATH}/model.json`);
    const oldNumClasses = oldModel.layers[oldModel.layers.length - 1].outputShape[1];

    if (oldNumClasses === numClasses) {
      // El número de gestos no cambió, podemos continuar entrenando
      console.log("El número de clases no cambió. Continuando entrenamiento.");
      model = oldModel;

    } else {
      // ¡El número de clases cambió! (Tu error)
      // Debemos recrear el modelo y transferir los pesos.
      console.warn(`¡El número de clases cambió de ${oldNumClasses} a ${numClasses}!`);
      console.warn("Reconstruyendo la capa final del modelo...");

      // 1. Quita la capa final (la que tiene 5 salidas)
      const penultimateLayer = oldModel.layers[oldModel.layers.length - 2];

      // 2. Crea un nuevo modelo "cuerpo" usando las entradas del modelo viejo
      //    y la salida de la penúltima capa.
      const body = tf.model({
        inputs: oldModel.inputs,
        outputs: penultimateLayer.output
      });

      // 3. Crea una nueva "cabeza" (la capa final)
      const newHead = tf.layers.dense({
        units: numClasses, // ¡Usa el nuevo número de clases!
        activation: "softmax",
        inputShape: [penultimateLayer.outputShape[1]] // La entrada es la salida del cuerpo
      });
      
      // 4. Aplica la nueva cabeza a la salida del cuerpo
      const newOutput = newHead.apply(body.output);
      
      // 5. Crea el modelo final
      model = tf.model({ inputs: body.inputs, outputs: newOutput });
      
      // Opcional: congelar las capas del cuerpo para entrenar solo la nueva cabeza
      //body.layers.forEach(layer => layer.trainable = false);
      // -----------------------------
      
      console.log("Nueva arquitectura del modelo creada.");
    }
    
  } else {
    // Si no existe, créalo
    console.log("Creando un modelo nuevo...");
    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [numFeatures], units: 128, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));
  }

  model.summary();

  // 4. Entrenar el Modelo
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  console.log("Entrenando...");
   await model.fit(X, y, {
    epochs: 100, // Aumenta esto si tienes más datos
    batchSize: 32,
    shuffle: true,
    validationSplit: 0.20, // Usar 20% de los datos para validación
    callbacks: tf.callbacks.earlyStopping({ 
        monitor: 'val_loss', 
        patience: 5, // Más paciencia antes de detenerse
    })
  });

  // 5. Guardar Modelo y Etiquetas
  await model.save(MODEL_SAVE_PATH);
  fs.writeFileSync(MODEL_INFO_PATH, JSON.stringify({ labels: newLabels })); // Guarda las nuevas etiquetas

  console.log(`✅ Modelo guardado en ${MODEL_SAVE_PATH}`);
  console.log(`✅ Etiquetas guardadas en ${MODEL_INFO_PATH}`);
}

// Ejecutar el entrenamiento
trainModel().catch(console.error);