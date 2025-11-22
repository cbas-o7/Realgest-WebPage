import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import GestureLog from "../models/GestureLog.js";
import UsageStat from "../models/UsageStat.js";
import { getUser, isEducator } from "../middleware/auth.js";
import fs from "fs"; // <-- AÑADE fs
import path from "path"; // <-- AÑADE path
import { fileURLToPath } from "url"; // <-- AÑADE fileURLToPath

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../data/gestures.json");

const router = express.Router();

// Todos los endpoints aquí requieren ser educador
router.use(getUser, isEducator);

// --- Rutas para students.html ---

// Obtener la lista de alumnos del educador
router.get("/students", async (req, res) => {
  try {
    const students = await User.find(
      { educator: req.user._id },
      'username email vocabularyLevel' // Solo devuelve estos campos
    );
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Error al buscar alumnos", error: err.message });
  }
});

// Agregar un alumno
router.post("/add-student", async (req, res) => {
  const { email, vocabularyLevel } = req.body;
  try {
    const student = await User.findOneAndUpdate(
      { email: email, role: 'usuario' }, // Busca al alumno por email
      { 
        educator: req.user._id, // Asigna este educador
        vocabularyLevel: vocabularyLevel 
      },
      { new: true } // Devuelve el documento actualizado
    );
    
    if (!student) {
      return res.status(404).json({ message: "No se encontró un usuario con ese email o ya es educador." });
    }
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: "Error al agregar alumno", error: err.message });
  }
});

// Modificar un alumno
router.put("/student/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { vocabularyLevel } = req.body;
  
  try {
    const student = await User.findOneAndUpdate(
      { _id: studentId, educator: req.user._id }, // Asegura que solo puedas modificar TUS alumnos
      { vocabularyLevel: vocabularyLevel },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ message: "Alumno no encontrado o no asignado a ti." });
    }
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: "Error al modificar alumno", error: err.message });
  }
});

// --- Rutas para reports.html ---
router.get("/reports", async (req, res) => {
  const { studentId, dateFrom, dateTo } = req.query;

  try {
    // 1. Obtener la lista de IDs de los alumnos de este educador
    const studentIds = await User.find(
      { educator: req.user._id },
      '_id'
    ).then(users => users.map(u => u._id));

    if (studentIds.length === 0) {
      return res.status(200).json({ stats: [], gestures: [] });
    }

    // 2. Construir filtros de fecha (si existen)
    let dateFilter = {};
    if (dateFrom) dateFilter.$gte = dateFrom;
    if (dateTo) dateFilter.$lte = dateTo;

    // 3. Filtro de alumno
    let studentFilter = { user: { $in: studentIds } };
    if (studentId && studentId !== 'all') {
       // Asegurarse que el studentId solicitado pertenezca al educador
       if (studentIds.map(id => id.toString()).includes(studentId)) {
         studentFilter = { user: new mongoose.Types.ObjectId(studentId) };
       } else {
         return res.status(403).json({ message: "ID de alumno no válido" });
       }
    }
    
    // 4. Query de Estadísticas de Uso (Tiempo y Palabras)
    const stats = await UsageStat.aggregate([
      { $match: studentFilter }, // Filtra por los alumnos del educador (o uno específico)
      { $match: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {} },
      {
        $group: {
          _id: "$user",
          totalWords: { $sum: "$wordsTranslated" },
          totalTime: { $sum: "$sessionTimeInSeconds" }
        }
      },
      { // Unir con la info del usuario
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      { $project: {
          _id: 0,
          userId: "$_id",
          username: "$userDetails.username",
          email: "$userDetails.email",
          totalWords: 1,
          totalTime: 1
      }}
    ]);

    // 5. Query de Gestos más usados
    const gestures = await GestureLog.aggregate([
      { $match: studentFilter },
      { $match: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {} },
      {
        $group: {
          _id: { label: "$label", user: "$user" },
          totalCount: { $sum: "$count" }
        }
      },
      { $sort: { totalCount: -1 } },
      {
        $lookup: { from: "users", localField: "_id.user", foreignField: "_id", as: "userDetails" }
      },
      { $unwind: "$userDetails" },
      { $project: {
          _id: 0,
          label: "$_id.label",
          userId: "$_id.user",
          username: "$userDetails.username",
          count: "$totalCount"
      }}
    ]);

    res.status(200).json({ stats, gestures });

  } catch (err) {
    res.status(500).json({ message: "Error al generar reporte", error: err.message });
  }
});

router.get("/dashboard-stats", async (req, res) => {
  try {
    const educatorId = req.user._id;

    // 1. Contar alumnos
    const studentCount = await User.countDocuments({ educator: educatorId });

    // 2. Contar Gestos Registrados en BD (GestureLog)
    // Obtenemos los IDs de mis alumnos
    const myStudents = await User.find({ educator: educatorId }, '_id');

    // Buscamos en el log cuántos registros hay de estos alumnos
    const gestureCount = await GestureLog.countDocuments({ 
      user: { $in: myStudents } 
    });

    // 3. Obtener alumnos recientes (los 3 últimos asignados)
    const recentStudents = await User.find(
        { educator: educatorId },
        'username email vocabularyLevel' // Proyecta solo estos campos
      )
      .sort({ createdAt: -1 }) // Ordena por fecha de creación
      .limit(3); 

    res.status(200).json({
      totalStudents: studentCount,
      totalGestures: gestureCount,
      recentStudents: recentStudents
      // Ignoramos "Reportes Generados" ya que no lo estamos guardando
    });

  } catch (err) {
    res.status(500).json({ message: "Error al cargar estadísticas del dashboard", error: err.message });
  }
});

export default router;