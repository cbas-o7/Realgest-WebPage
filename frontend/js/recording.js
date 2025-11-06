import { sendToBackend } from "../api/gestures.service.js";

let latestLandmarks = null;
let videoStream = null;
let sessionStartTime = null;
let sessionInterval = null;
let gesturesDetected = 0;
let wordsTranslated = 0;

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
const canvasCtx = canvasElement.getContext("2d");

const holistic = new Holistic({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
});

holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  refineFaceLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

holistic.onResults(onResults);

function onResults(results) {
  //console.log(results); // para ver si hay landmarks
  // Ajusta tamaño del canvas al del video
  if (videoElement.videoWidth && videoElement.videoHeight) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  // Dibuja los landmarks
  if (results.faceLandmarks) {
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: 1,
    });
    /* drawLandmarks(canvasCtx, results.faceLandmarks, {
      color: "#FF0000",
      lineWidth: 1,
    }); */
  }
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#FF0000",
      lineWidth: 2,
    });
  }
  if (results.leftHandLandmarks) {
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "#00FFFF",
      lineWidth: 2,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "#FFFFFF",
      lineWidth: 1,
    });
  }
  if (results.rightHandLandmarks) {
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "#FF00FF",
      lineWidth: 2,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#FFFFFF",
      lineWidth: 1,
    });
  }
  canvasCtx.restore();

  // Guardar datos numéricos
  latestLandmarks = {
    timestamp: Date.now(),
    pose: results.poseLandmarks || [],
    face: results.faceLandmarks || [],
    leftHand: results.leftHandLandmarks || [],
    rightHand: results.rightHandLandmarks || [],
  };
}

// === Enviar datos al backend cada 2 segundos ===
setInterval(() => {
  if (latestLandmarks) {
    sendToBackend(latestLandmarks);
  }
}, 2000);

function startHolistic(videoEl) {
  const holisticCamera = new Camera(videoEl, {
    onFrame: async () => {
      await holistic.send({ image: videoEl });
    },
    width: 1280,
    height: 720,
  });
  holisticCamera.start();
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
      startHolistic(videoElement); // 👈 aquí se activa Mediapipe
    };

    // Start session timer
    //sessionStartTime = Date.now();
    //sessionInterval = setInterval(updateSessionTime, 1000);

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

    // Limpiar y ocultar el canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    //canvasElement.classList.add("hidden");

    // Update UI
    //canvasElement.classList.add("hidden");
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

  const translationItem = document.createElement("p");
  translationItem.className = "text-gray-800 text-lg mb-2";
  translationItem.textContent = text;
  translationOutput.appendChild(translationItem);

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
