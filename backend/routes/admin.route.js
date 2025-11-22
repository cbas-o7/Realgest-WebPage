// Crea backend/routes/admin.route.js
import express from "express";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { loadModel } from "../server.js"; // Importamos la función para recargar
import { ok } from "assert";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para Entrenar y Recargar
router.post("/train-and-reload", async (req, res) => {
  console.log("🔄 Iniciando proceso de entrenamiento...");
  
  // Ruta al script train.js (subimos un nivel desde /routes a /backend)
  const trainScript = path.join(__dirname, "..", "train.js");

  // Ejecuta el comando 'node train.js' como si estuvieras en la terminal
  exec(`node "${trainScript}"`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al entrenar: ${error.message}`);
      return res.status(500).json({ message: "Error al ejecutar el entrenamiento", error: error.message });
    }
    
    if (stderr) {
      console.log(`⚠️ stderr: ${stderr}`); // Warnings de TensorFlow, no necesariamente errores
    }

    console.log(`✅ Entrenamiento finalizado:\n${stdout}`);

    // Una vez terminado, recargamos el modelo en el servidor
    try {
      await loadModel();
      console.log("🔄 Modelo recargado en memoria.");
      res.status(200).json({ message: "Entrenamiento exitoso y modelo recargado.", ok: true });
    } catch (reloadError) {
      res.status(500).json({ message: "Entrenamiento terminó, pero falló la recarga.", error: reloadError.message });
    }
  });
});

export default router;