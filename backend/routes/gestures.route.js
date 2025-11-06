import express from "express";
import * as tf from "@tensorflow/tfjs";

const router = express.Router();



// Registro
router.post("/landmarks", async (req, res) => {
  try {
    const data = req.body;

  // Aquí puedes procesar, guardar o reenviar los datos al modelo Python
  console.log("📥 Datos recibidos del frontend:", {
    pose: data.pose?.length,
    face: data.face?.length,
    leftHand: data.leftHand?.length,
    rightHand: data.rightHand?.length,
  });

  res.status(200).json({ message: "Landmarks recibidos correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

export default router;