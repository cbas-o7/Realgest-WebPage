import { predictSequence } from "../service/gestures.service.js";
import { updateStats } from "../service/stats.service.js";
import HolisticManager from "./HolisticManager.js";


let videoStream = null;
let sessionWordCount = 0;
let sessionStartTime = null;
let sessionInterval = null;
let gesturesDetected = 0;
let wordsTranslated = 0;
let detectedWords = [];

// BÚFER ---
let sequenceBuffer = [];
let isHandVisible = false;
let handTimeout = null;
const GESTURE_TIMEOUT = 100; // 500ms de espera antes de enviar
const MIN_SEQUENCE_FRAMES = 30; // Mínimo 30 fotogramas para un gesto

// DOM Elements
const videoElement = document.getElementById("videoElement");
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const cameraStatus = document.getElementById("cameraStatus");
const noCameraMessage = document.getElementById("noCameraMessage");
const translationOutput = document.getElementById("translationOutput");
const voiceToggle = document.getElementById("voiceToggle");
const clearTranslationBtn = document.getElementById("clearTranslationBtn");
const gesturesCount = document.getElementById("gesturesCount");
const wordsCount = document.getElementById("wordsCount");
const sessionTime = document.getElementById("sessionTime");

// ===================== MEDIAPIPE HOLISTIC =====================
const canvasElement = document.getElementById("outputCanvas");

// Crear el manager y registrar callback para recibir landmarks numéricos
const holisticManager = new HolisticManager({
  videoElement: videoElement,
  canvasElement: canvasElement,
  onResults: (landmarks, results) => { // 'landmarks' es tu objeto procesado
    
    // --- 3. LÓGICA DE DETECCIÓN DE MANOS Y BÚFER ---
    const handsDetected =
      (landmarks.leftHand && landmarks.leftHand.length > 0) ||
      (landmarks.rightHand && landmarks.rightHand.length > 0);

    if (handsDetected) {
      // Si hay manos, sigue grabando
      if (handTimeout) {
        clearTimeout(handTimeout); // Cancela el temporizador si la mano reaparece
        handTimeout = null;
      }
      isHandVisible = true;
      sequenceBuffer.push(landmarks); // Añade el fotograma al búfer
    
    } else if (isHandVisible) {
      // Si no hay manos, PERO las había en el fotograma anterior
      // Inicia un temporizador.
      if (!handTimeout) {
        handTimeout = setTimeout(async () => {
          console.log(`Mano desapareció, enviando ${sequenceBuffer.length} fotogramas...`);
          isHandVisible = false;
          
          if (sequenceBuffer.length > MIN_SEQUENCE_FRAMES) {
            // Envía la secuencia al backend para predecir
            const result = await predictSequence(sequenceBuffer);
            if (result && result.prediction && result.prediction !== "---") {
              addTranslation(result.prediction);
              sessionWordCount++;
            }
          }
          
          // Limpia el búfer para el próximo gesto
          sequenceBuffer = [];
          handTimeout = null;
        }, GESTURE_TIMEOUT);
      }
    }
    // Si no hay manos y no había antes, no hace nada.
  },
});


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
    sessionWordCount = 0;
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

    sequenceBuffer = [];
    if (handTimeout) clearTimeout(handTimeout);
    handTimeout = null;
    isHandVisible = false;

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

// Add Translation
function addTranslation(text) {
  if (translationOutput.querySelector(".italic")) {
    translationOutput.innerHTML = "";
  }
  
  // No añadir la misma palabra dos veces seguidas
  /* if (detectedWords[detectedWords.length - 1] === text) {
    return;
  } */

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

async function saveSessionStats() {
  if (sessionStartTime === null) return; // No se inició sesión

  // Calcula el tiempo transcurrido en segundos
  const sessionEndTime = Date.now();
  const timeElapsedInSeconds = Math.floor((sessionEndTime - sessionStartTime) / 1000);

  // Solo guarda si hubo actividad
  if (sessionWordCount > 0 || timeElapsedInSeconds > 10) {
    console.log(`Guardando sesión: ${sessionWordCount} palabras, ${timeElapsedInSeconds} segundos.`);
    await updateStats(sessionWordCount, timeElapsedInSeconds);
  }

  // Resetea para la próxima vez que se inicie la cámara
  sessionStartTime = null;
  sessionWordCount = 0;
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
  }
  saveSessionStats();
});
