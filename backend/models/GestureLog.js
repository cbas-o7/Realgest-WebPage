import mongoose from "mongoose";

const gestureLogSchema = new mongoose.Schema({
  // Quién hizo el gesto
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  // Qué gesto fue (la etiqueta predecida)
  label: { 
    type: String, 
    required: true 
  },
  // Cuándo se reconoció por primera vez
  firstRecognized: { 
    type: Date, 
    default: Date.now 
  },
  // Cuántas veces lo ha usado hoy
  count: {
    type: Number,
    default: 1
  },
  // Para agrupar por día
  date: {
    type: String, // YYYY-MM-DD
    default: () => new Date().toISOString().split('T')[0]
  }
});

// Índice para hacer las búsquedas por usuario y día más rápidas
gestureLogSchema.index({ user: 1, label: 1, date: 1 }, { unique: true });

export default mongoose.model("GestureLog", gestureLogSchema);