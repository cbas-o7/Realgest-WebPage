import { sendToBackend } from "../api/gestures.service.js";
import HolisticManager from "./HolisticManager.js";

let latestLandmarks = null;
let videoStream = null;
let sessionStartTime = null;
let sessionInterval = null;
let gesturesDetected = 0;
let wordsTranslated = 0;
let detectedWords = []; // Para guardar las palabras

// DOM Elements
const videoElement = document.getElementById("videoElement");
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const cameraStatus = document.getElementById("cameraStatus");
const noCameraMessage = document.getElementById("noCameraMessage");
const translationOutput = document.getElementById("translationOutput");
const voiceToggle = document.getElementById("voiceToggle");
const clearTranslationBtn = document.getElementById("clearTranslationBtn");
const logoutBtn = document.getElementById("logoutBtn");
const gesturesCount = document.getElementById("gesturesCount");
const wordsCount = document.getElementById("wordsCount");
const sessionTime = document.getElementById("sessionTime");

// ===================== MEDIAPIPE HOLISTIC =====================
const canvasElement = document.getElementById("outputCanvas");

// Crear el manager y registrar callback para recibir landmarks numéricos
const holisticManager = new HolisticManager({
  videoElement: videoElement,
  canvasElement: canvasElement,
  onResults: (landmarks) => {
    // actualizar variable compartida que usa el resto del archivo
    latestLandmarks = landmarks;
  },
});

// === Enviar datos al backend cada 2 segundos ===
setInterval(async() => {
  if (latestLandmarks && videoStream) {
    const result = await sendToBackend(latestLandmarks);
    
    // --- NUEVO: Procesar la predicción ---
    if (result && result.prediction) {
      addTranslation(result.prediction);
    }
    // ------------------------------------
  }
}, 100);

// Reemplazar startHolistic por llamada al manager.start()
function startHolistic() {
  return holisticManager.start();
}

// Start Camera
startCameraBtn.addEventListener("click", async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    videoElement.srcObject = videoStream;
    noCameraMessage.classList.add("hidden");
    //canvasElement.classList.remove("hidden"); // Mostrar el canvas al iniciar

    // Update UI
    startCameraBtn.classList.add("hidden");
    stopCameraBtn.classList.remove("hidden");
    cameraStatus.classList.remove("bg-red-500");
    cameraStatus.classList.add("bg-green-500");
    cameraStatus.innerHTML =
      '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> Cámara Activa';

    videoElement.onloadedmetadata = () => {
      console.log("✅ Cámara lista, iniciando Mediapipe...");
      startHolistic(); // 👈 aquí se activa Mediapipe
    };

    // Start session timer
    sessionStartTime = Date.now();
    sessionInterval = setInterval(updateSessionTime, 1000);

    // Simulate gesture detection (replace with actual AI model)
    //simulateGestureDetection();
  } catch (error) {
    alert("Error al acceder a la cámara. Por favor, verifica los permisos.");
    console.error("Camera error:", error);
  }
});

// Stop Camera
stopCameraBtn.addEventListener("click", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
    videoStream = null;

    // detener el manager y limpiar canvas
    holisticManager.stop();

    startCameraBtn.classList.remove("hidden");
    stopCameraBtn.classList.add("hidden");
    cameraStatus.classList.remove("bg-green-500");
    cameraStatus.classList.add("bg-red-500");
    cameraStatus.innerHTML =
      '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> Cámara Inactiva';
    noCameraMessage.classList.remove("hidden");

    // Stop session timer
    if (sessionInterval) {
      clearInterval(sessionInterval);
      sessionInterval = null;
    }
  }
});

// Update Session Time
function updateSessionTime() {
  if (sessionStartTime) {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    sessionTime.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }
}

// Simulate Gesture Detection (replace with actual AI model)
function simulateGestureDetection() {
  const sampleGestures = [
    "Hola",
    "Gracias",
    "Por favor",
    "Sí",
    "No",
    "Ayuda",
    "Agua",
    "Comida",
  ];

  const detectionInterval = setInterval(() => {
    if (!videoStream) {
      clearInterval(detectionInterval);
      return;
    }

    // Randomly detect gestures
    if (Math.random() > 0.7) {
      const gesture =
        sampleGestures[Math.floor(Math.random() * sampleGestures.length)];
      addTranslation(gesture);
      gesturesDetected++;
      wordsTranslated++;
      gesturesCount.textContent = gesturesDetected;
      wordsCount.textContent = wordsTranslated;
    }
  }, 3000);
}

// Add Translation
function addTranslation(text) {
  if (translationOutput.querySelector(".italic")) {
    translationOutput.innerHTML = "";
  }
  
  // No añadir la misma palabra dos veces seguidas
  if (detectedWords[detectedWords.length - 1] === text) {
    return;
  }

  detectedWords.push(text);

  // Actualizar el texto
  translationOutput.innerHTML = `<p class="text-gray-800 text-lg">${detectedWords.join(" ")}</p>`;
  
  // Actualizar contadores
  gesturesDetected++;
  wordsTranslated = detectedWords.length;
  gesturesCount.textContent = gesturesDetected;
  wordsCount.textContent = wordsTranslated;

  // Speak if voice is enabled
  if (voiceToggle.checked) {
    speakText(text);
  }

  // Auto-scroll to bottom
  translationOutput.scrollTop = translationOutput.scrollHeight;
}

// Text to Speech
function speakText(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

// Clear Translation
clearTranslationBtn.addEventListener("click", () => {
  translationOutput.innerHTML =
    '<p class="text-gray-400 text-center italic">La traducción aparecerá aquí...</p>';
  detectedWords = []; // Limpiar el historial
  gesturesDetected = 0;
  wordsTranslated = 0;
  gesturesCount.textContent = "0";
  wordsCount.textContent = "0";
});

// Logout
logoutBtn.addEventListener("click", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
  }

  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?");
  if (confirmLogout) {
    window.location.href = "index.html";
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
  }
});
