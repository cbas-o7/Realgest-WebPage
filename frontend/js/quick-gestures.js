// Logout functionality
const logoutBtn = document.getElementById("logoutBtn")

logoutBtn.addEventListener("click", () => {
  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?")
  if (confirmLogout) {
    window.location.href = "../index.html"
  }
})

const iotToggle = document.getElementById("iotToggle")
const iotToggleCircle = document.getElementById("iotToggleCircle")
const iotStatus = document.getElementById("iotStatus")

let iotConnected = false

iotToggle.addEventListener("click", () => {
  iotConnected = !iotConnected

  if (iotConnected) {
    iotToggle.classList.remove("bg-gray-300")
    iotToggle.classList.add("bg-primary")
    iotToggleCircle.classList.remove("translate-x-1")
    iotToggleCircle.classList.add("translate-x-12")
    iotStatus.classList.remove("hidden")
  } else {
    iotToggle.classList.remove("bg-primary")
    iotToggle.classList.add("bg-gray-300")
    iotToggleCircle.classList.remove("translate-x-12")
    iotToggleCircle.classList.add("translate-x-1")
    iotStatus.classList.add("hidden")
  }

  // Save state to localStorage
  localStorage.setItem("iotConnected", iotConnected)
})

// Load saved IoT state
const savedIotState = localStorage.getItem("iotConnected") === "true"
if (savedIotState) {
  iotToggle.click()
}

// Text-to-Speech functionality
const gestureBtns = document.querySelectorAll(".gesture-btn")
const ttsStatus = document.getElementById("ttsStatus")

gestureBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.getAttribute("data-text")
    speakText(text)
  })
})

function speakText(text) {
  // Check if browser supports speech synthesis
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "es-ES"
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    // Show status
    ttsStatus.classList.remove("hidden")

    // Hide status when done
    utterance.onend = () => {
      setTimeout(() => {
        ttsStatus.classList.add("hidden")
      }, 500)
    }

    // Speak
    window.speechSynthesis.speak(utterance)
  } else {
    alert("Tu navegador no soporta síntesis de voz")
  }
}

