// Crea backend/routes/admin.route.js
import express from "express";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { loadModel } from "../server.js"; // Importamos la función para recargar
import { ok } from "assert";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para Entrenar y Recargar
router.post("/train-and-reload", async (req, res) => {
  console.log("// Iniciando proceso de entrenamiento... //");
  
  // Ruta al script train.js (subimos un nivel desde /routes a /backend)
  const trainScript = path.join(__dirname, "..", "train.js");
  const statsPath = path.join(__dirname, "..", "model", "training_stats.json");

  // Ejecuta el comando 'node train.js' como si estuvieras en la terminal
  exec(`node "${trainScript}"`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al entrenar: ${error.message}`);
      return res.status(500).json({ ok: false, message: "Error al ejecutar el entrenamiento", error: error.message });
    }
    
    if (stderr) {
      console.log(`⚠️ stderr: ${stderr}`); // Warnings de TensorFlow, no necesariamente errores
    }

    console.log(`✅ Entrenamiento finalizado:\n${stdout}`);

    // Leer estadísticas
    let stats = { accuracy: 0 };
    try {
        if (fs.existsSync(statsPath)) {
            stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        }
    } catch (e) {
        console.error("Error leyendo stats:", e);
    }

    // Una vez terminado, recargamos el modelo en el servidor
    try {
      await loadModel();
      console.log("🔄 Modelo recargado en memoria.");
      res.status(200).json({ 
          ok: true, 
          message: "Entrenamiento exitoso.",
          stats: stats // Enviamos la precisión al frontend
      });
    } catch (reloadError) {
      res.status(500).json({ ok: false, message: "Fallo en recarga.", error: reloadError.message });
    }
  });
});

export default router;