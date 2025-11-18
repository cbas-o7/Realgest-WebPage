import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "El correo ya está registrado" });

    const user = new User({ username, email, password, role });
    await user.save();

    res.status(201).json({ message: "Usuario registrado con éxito", user: { id:user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

    res.json({ message: "Login exitoso", user: { id:user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

export default router;
