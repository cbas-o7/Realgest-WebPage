import User from '../models/User.js';

// Middleware simple para obtener el usuario desde un header.
export const getUser = async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ message: "No se proporcionó ID de usuario (x-user-id)" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    req.user = user; // Adjuntamos el objeto de usuario completo a la petición
    next();
  } catch (err) {
    return res.status(500).json({ message: "Error de autenticación", error: err.message });
  }
};

// Middleware para verificar que el usuario es un "educador"
export const isEducator = (req, res, next) => {
  if (req.user && req.user.role === 'educador') {
    next();
  } else {
    res.status(403).json({ message: "Acceso denegado. Se requiere rol de educador." });
  }
};