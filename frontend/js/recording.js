

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

// Start Camera
startCameraBtn.addEventListener("click", async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    videoElement.srcObject = videoStream;
    noCameraMessage.classList.add("hidden");

    // Update UI
    startCameraBtn.classList.add("hidden");
    stopCameraBtn.classList.remove("hidden");
    cameraStatus.classList.remove("bg-red-500");
    cameraStatus.classList.add("bg-green-500");
    cameraStatus.innerHTML =
      '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> Cámara Activa';

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

    // Update UI
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
