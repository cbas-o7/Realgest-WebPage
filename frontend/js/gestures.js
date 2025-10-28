let videoStream = null
let capturedGesture = null
let savedGestures = []

// DOM Elements
const videoElement = document.getElementById("videoElement")
const startCameraBtn = document.getElementById("startCameraBtn")
const stopCameraBtn = document.getElementById("stopCameraBtn")
const cameraStatus = document.getElementById("cameraStatus")
const recordingIndicator = document.getElementById("recordingIndicator")
const noCameraMessage = document.getElementById("noCameraMessage")
const gestureForm = document.getElementById("gestureForm")
const gestureName = document.getElementById("gestureName")
const captureGestureBtn = document.getElementById("captureGestureBtn")
const saveGestureBtn = document.getElementById("saveGestureBtn")
const captureStatus = document.getElementById("captureStatus")
const gesturesList = document.getElementById("gesturesList")
const gestureCount = document.getElementById("gestureCount")
const searchGestures = document.getElementById("searchGestures")
const logoutBtn = document.getElementById("logoutBtn")

// Load saved gestures from localStorage
function loadSavedGestures() {
  const stored = localStorage.getItem("realgest_gestures")
  if (stored) {
    savedGestures = JSON.parse(stored)
    updateGesturesList()
  }
}

// Start Camera
startCameraBtn.addEventListener("click", async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    })

    videoElement.srcObject = videoStream
    noCameraMessage.classList.add("hidden")

    // Update UI
    startCameraBtn.classList.add("hidden")
    stopCameraBtn.classList.remove("hidden")
    cameraStatus.classList.remove("bg-red-500")
    cameraStatus.classList.add("bg-green-500")
    cameraStatus.innerHTML = '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> Cámara Activa'

    // Enable capture button
    captureGestureBtn.disabled = false
  } catch (error) {
    alert("Error al acceder a la cámara. Por favor, verifica los permisos.")
    console.error("Camera error:", error)
  }
})

// Stop Camera
stopCameraBtn.addEventListener("click", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop())
    videoElement.srcObject = null
    videoStream = null

    // Update UI
    startCameraBtn.classList.remove("hidden")
    stopCameraBtn.classList.add("hidden")
    cameraStatus.classList.remove("bg-green-500")
    cameraStatus.classList.add("bg-red-500")
    cameraStatus.innerHTML = '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> Cámara Inactiva'
    noCameraMessage.classList.remove("hidden")

    // Disable capture button
    captureGestureBtn.disabled = true
  }
})

// Capture Gesture
captureGestureBtn.addEventListener("click", () => {
  if (!videoStream) {
    alert("Por favor, inicia la cámara primero")
    return
  }

  if (!gestureName.value.trim()) {
    alert("Por favor, ingresa un nombre para el gesto")
    gestureName.focus()
    return
  }

  // Show recording indicator
  recordingIndicator.classList.remove("hidden")
  captureGestureBtn.disabled = true

  // Simulate capture process (replace with actual AI model)
  setTimeout(() => {
    // Create canvas to capture frame
    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext("2d")
    ctx.drawImage(videoElement, 0, 0)

    capturedGesture = {
      name: gestureName.value.trim(),
      timestamp: Date.now(),
      imageData: canvas.toDataURL("image/jpeg", 0.8),
    }

    // Hide recording indicator
    recordingIndicator.classList.add("hidden")
    captureGestureBtn.disabled = false

    // Show success message
    showCaptureStatus("success", "✓ Gesto capturado correctamente")

    // Enable save button
    saveGestureBtn.disabled = false
  }, 2000)
})

// Save Gesture
gestureForm.addEventListener("submit", (e) => {
  e.preventDefault()

  if (!capturedGesture) {
    alert("Por favor, captura el gesto primero")
    return
  }

  // Add to saved gestures
  savedGestures.unshift(capturedGesture)

  // Save to localStorage
  localStorage.setItem("realgest_gestures", JSON.stringify(savedGestures))

  // Update UI
  updateGesturesList()
  showCaptureStatus("success", "✓ Gesto guardado exitosamente")

  // Reset form
  gestureForm.reset()
  capturedGesture = null
  saveGestureBtn.disabled = true

  // Hide status after 3 seconds
  setTimeout(() => {
    captureStatus.classList.add("hidden")
  }, 3000)
})

// Show Capture Status
function showCaptureStatus(type, message) {
  captureStatus.classList.remove("hidden", "bg-green-100", "bg-red-100", "text-green-700", "text-red-700")

  if (type === "success") {
    captureStatus.classList.add("bg-green-100", "text-green-700")
  } else {
    captureStatus.classList.add("bg-red-100", "text-red-700")
  }

  captureStatus.querySelector("p").textContent = message
}

// Update Gestures List
function updateGesturesList() {
  gestureCount.textContent = savedGestures.length

  if (savedGestures.length === 0) {
    gesturesList.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <div class="text-5xl mb-3">✏️</div>
        <p class="font-medium">No hay gestos guardados</p>
        <p class="text-sm mt-1">Crea tu primer gesto personalizado</p>
      </div>
    `
    return
  }

  const searchTerm = searchGestures.value.toLowerCase()
  const filteredGestures = savedGestures.filter((gesture) => gesture.name.toLowerCase().includes(searchTerm))

  if (filteredGestures.length === 0) {
    gesturesList.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <p class="font-medium">No se encontraron gestos</p>
        <p class="text-sm mt-1">Intenta con otro término de búsqueda</p>
      </div>
    `
    return
  }

  gesturesList.innerHTML = filteredGestures
    .map(
      (gesture, index) => `
    <div class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
      <img src="${gesture.imageData}" alt="${gesture.name}" class="w-16 h-16 object-cover rounded-lg">
      <div class="flex-1">
        <p class="font-semibold text-gray-800">${gesture.name}</p>
        <p class="text-xs text-gray-500">${new Date(gesture.timestamp).toLocaleDateString("es-ES")}</p>
      </div>
      <button onclick="deleteGesture(${savedGestures.indexOf(gesture)})" class="text-red-500 hover:text-red-700 font-bold text-xl">
        ×
      </button>
    </div>
  `,
    )
    .join("")
}

// Delete Gesture
window.deleteGesture = (index) => {
  if (confirm("¿Estás seguro de que deseas eliminar este gesto?")) {
    savedGestures.splice(index, 1)
    localStorage.setItem("realgest_gestures", JSON.stringify(savedGestures))
    updateGesturesList()
  }
}

// Search Gestures
searchGestures.addEventListener("input", updateGesturesList)

// Logout
logoutBtn.addEventListener("click", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop())
  }

  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?")
  if (confirmLogout) {
    window.location.href = "index.html"
  }
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop())
  }
})

// Load gestures on page load
loadSavedGestures()
