import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["usuario", "educador"], default: "usuario" },
  
  // Para el rol "usuario": a qué educador está asignado
  educator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  // Nivel asignado por el educador
  vocabularyLevel: { 
    type: String, 
    enum: ['basico', 'intermedio', 'avanzado'], 
    default: 'basico' 
  }
}, { timestamps: true });

// encripta la contraseña
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// metodo para comparar contraseñas
userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
