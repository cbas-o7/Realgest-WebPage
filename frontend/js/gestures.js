import { collectSequence } from "../api/gestures.service.js";
import HolisticManager from "./HolisticManager.js";

let videoStream = null;
let capturedGesture = null;
let latestLandmarks = null;

let savedGestures = []; // Esto seguirá guardando las "capturas" para la UI
let recordingSequence = []; // Aquí guardaremos los frames para el modelo
let isRecording = false;

// DOM Elements
const videoElement = document.getElementById("videoElement");
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const cameraStatus = document.getElementById("cameraStatus");
const recordingIndicator = document.getElementById("recordingIndicator");
const noCameraMessage = document.getElementById("noCameraMessage");
const gestureForm = document.getElementById("gestureForm");
const gestureName = document.getElementById("gestureName");
const captureGestureBtn = document.getElementById("captureGestureBtn");
const saveGestureBtn = document.getElementById("saveGestureBtn"); // Botón para guardar gesto
const captureStatus = document.getElementById("captureStatus");
const gesturesList = document.getElementById("gesturesList");
const gestureCount = document.getElementById("gestureCount");
const searchGestures = document.getElementById("searchGestures");
const logoutBtn = document.getElementById("logoutBtn");

// ===================== MEDIAPIPE HOLISTIC =====================
const canvasElement = document.getElementById("outputCanvas");

// Crear el manager y registrar callback para recibir landmarks numéricos
const holisticManager = new HolisticManager({
  videoElement: videoElement,
  canvasElement: canvasElement,
  onResults: (landmarks) => {
    // actualizar variable compartida que usa el resto del archivo
    latestLandmarks = landmarks;

    if (isRecording) {
      /* const landmarks = {
      pose: results.poseLandmarks || [],
      face: results.faceLandmarks || [],
      leftHand: results.leftHandLandmarks || [],
      rightHand: results.rightHandLandmarks || [],
    }; */
      recordingSequence.push(landmarks);
    }
  },
});

// Reemplazar startHolistic por llamada al manager.start()
function startHolistic() {
  return holisticManager.start();
}

// Load saved gestures from localStorage
function loadSavedGestures() {
  const stored = localStorage.getItem("realgest_gestures");
  if (stored) {
    savedGestures = JSON.parse(stored);
    updateGesturesList();
  }
}

// --- LÓGICA DE GRABACIÓN DE SECUENCIA ---

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

    // Enable capture button
    captureGestureBtn.disabled = false;
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

    // Disable capture button
    captureGestureBtn.disabled = true;
  }
});

// Capture Gesture
captureGestureBtn.addEventListener("click", () => {
  if (!videoStream) {
    alert("Por favor, inicia la cámara primero");
    return;
  }

  if (!gestureName.value.trim()) {
    alert("Por favor, ingresa un nombre para el gesto");
    gestureName.focus();
    return;
  }

  isRecording = true;
  recordingSequence = []; //limpiar secuencia previa

  // Show recording indicator
  recordingIndicator.classList.remove("hidden");
  captureGestureBtn.disabled = true;
  saveGestureBtn.disabled = true;

  showCaptureStatus(
    "info",
    "Grabando gesto... Mantén el gesto por 2 segundos."
  );

  // Detiene la grabación después de 2 segundos
  setTimeout(() => {
    isRecording = false;
    // Hide recording indicator
    recordingIndicator.classList.add("hidden");
    captureGestureBtn.disabled = false;

    if (recordingSequence.length < 10) {
      // Muy pocos fotogramas
      showCaptureStatus("error", "Error al capturar. Intenta de nuevo.");
      return;
    }

    // Habilita guardar
    saveGestureBtn.disabled = false;
    showCaptureStatus(
      "success",
      `✓ Gesto capturado (${recordingSequence.length} fotogramas). Presiona "Guardar Gesto".`
    );

    // Create canvas to capture frame
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0);

    capturedGesture = {
      name: gestureName.value.trim(),
      timestamp: Date.now(),
      imageData: canvas.toDataURL("image/jpeg", 0.8),
    };

    // Guarda la *imagen* para la lista de la UI
    savedGestures.unshift({
      name: gestureName.value.trim(),
      timestamp: Date.now(),
      imageData: canvas.toDataURL("image/jpeg", 0.8),
    });
  }, 2000);
});

// Save Gesture
gestureForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (recordingSequence.length === 0) {
    alert("Por favor, captura el gesto primero");
    return;
  }

  const label = gestureName.value.trim();

  // --- Envía la secuencia al backend ---
  showCaptureStatus("info", "Guardando secuencia en el backend...");
  const result = await collectSequence(label, recordingSequence);

  if (result.error) {
    showCaptureStatus("error", `Error al guardar: ${result.error}`);
    return;
  }
  // -----------------------------------

  // Actualiza la UI (como lo tenías antes)
  // Nota: `savedGestures` se llenó en el paso de captura
  localStorage.setItem("realgest_gestures", JSON.stringify(savedGestures));
  //updateGesturesList();
  showCaptureStatus("success", "✓ Gesto guardado exitosamente");

  // Reset form
  gestureForm.reset();
  recordingSequence = [];
  saveGestureBtn.disabled = true;

  setTimeout(() => {
    captureStatus.classList.add("hidden");
  }, 3000);
});

// Show Capture Status
function showCaptureStatus(type, message) {
  captureStatus.classList.remove("hidden", "bg-green-100", "bg-red-100", "bg-blue-100", "text-green-700", "text-red-700", "text-blue-700");

  if (type === "success") {
    captureStatus.classList.add("bg-green-100", "text-green-700");
  } else if (type === "error") {
    captureStatus.classList.add("bg-red-100", "text-red-700");
  } else { // 'info'
    captureStatus.classList.add("bg-blue-100", "text-blue-700");
  }

  captureStatus.querySelector("p").textContent = message;
}

// Update Gestures List
function updateGesturesList() {
  gestureCount.textContent = savedGestures.length;

  if (savedGestures.length === 0) {
    gesturesList.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <div class="text-5xl mb-3">✏️</div>
        <p class="font-medium">No hay gestos guardados</p>
        <p class="text-sm mt-1">Crea tu primer gesto personalizado</p>
      </div>
    `;
    return;
  }

  const searchTerm = searchGestures.value.toLowerCase();
  const filteredGestures = savedGestures.filter((gesture) =>
    gesture.name.toLowerCase().includes(searchTerm)
  );

  if (filteredGestures.length === 0) {
    gesturesList.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <p class="font-medium">No se encontraron gestos</p>
        <p class="text-sm mt-1">Intenta con otro término de búsqueda</p>
      </div>
    `;
    return;
  }

  gesturesList.innerHTML = filteredGestures
    .map(
      (gesture, index) => `
    <div class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
      <img src="${gesture.imageData}" alt="${
        gesture.name
      }" class="w-16 h-16 object-cover rounded-lg">
      <div class="flex-1">
        <p class="font-semibold text-gray-800">${gesture.name}</p>
        <p class="text-xs text-gray-500">${new Date(
          gesture.timestamp
        ).toLocaleDateString("es-ES")}</p>
      </div>
      <button onclick="deleteGesture(${savedGestures.indexOf(
        gesture
      )})" class="text-red-500 hover:text-red-700 font-bold text-xl">
        ×
      </button>
    </div>
  `
    )
    .join("");
}

// Delete Gesture
window.deleteGesture = (index) => {
  if (confirm("¿Estás seguro de que deseas eliminar este gesto?")) {
    savedGestures.splice(index, 1);
    localStorage.setItem("realgest_gestures", JSON.stringify(savedGestures));
    updateGesturesList();
  }
};

// Search Gestures
searchGestures.addEventListener("input", updateGesturesList);

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

// Load gestures on page load
loadSavedGestures();
