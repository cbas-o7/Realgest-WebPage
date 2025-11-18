import express from "express";
import UsageStat from "../models/UsageStat.js";
import { getUser } from "../middleware/auth.js";

const router = express.Router();

// Ruta para que recording.js guarde los datos de la sesión
router.post("/update", getUser, async (req, res) => {
  const { words, time } = req.body; // time en segundos, words es un conteo
  const today = new Date().toISOString().split('T')[0];

  try {
    await UsageStat.findOneAndUpdate(
      { user: req.user._id, date: today },
      { 
        $inc: { 
          wordsTranslated: words, 
          sessionTimeInSeconds: time 
        } 
      },
      { upsert: true }
    );
    res.status(200).json({ message: "Estadísticas actualizadas" });
  } catch (err) {
    res.status(500).json({ message: "Error al guardar estadísticas", error: err.message });
  }
});

// Ruta para que dashboard.js obtenga los totales
router.get("/dashboard", getUser, async (req, res) => {
  try {
    const stats = await UsageStat.aggregate([
      { $match: { user: req.user._id } }, // Filtra por el usuario logueado
      {
        $group: {
          _id: "$user",
          totalWords: { $sum: "$wordsTranslated" },
          totalTime: { $sum: "$sessionTimeInSeconds" }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({ totalWords: 0, totalTime: 0 });
    }
    
    const { totalWords, totalTime } = stats[0];
    
    // Convertir segundos a un string "Xh Ym"
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const timeString = `${hours}h ${minutes}m`;

    res.status(200).json({ totalWords, totalTime: timeString });

  } catch (err) {
    res.status(500).json({ message: "Error al obtener estadísticas", error: err.message });
  }
});

export default router;