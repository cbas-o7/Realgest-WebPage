// Crea este nuevo archivo: backend/models/UsageStat.js
import mongoose from "mongoose";

const usageStatSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true // Búsqueda rápida por usuario
  },
  date: {
    type: String, // YYYY-MM-DD
    default: () => new Date().toISOString().split('T')[0]
  },
  wordsTranslated: { 
    type: Number, 
    default: 0 
  },
  // Guardamos el tiempo en segundos
  sessionTimeInSeconds: { 
    type: Number, 
    default: 0 
  }
});

// Solo puede haber un registro por usuario por día
usageStatSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("UsageStat", usageStatSchema);
