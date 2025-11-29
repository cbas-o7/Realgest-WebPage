

const iotToggle = document.getElementById("iotToggle")
const iotToggleCircle = document.getElementById("iotToggleCircle")
const iotStatus = document.getElementById("iotStatus")

let iotConnected = false

let port;
let writer;

async function connectArduino() {
  try {
    // Solicita al usuario que seleccione un puerto
    port = await navigator.serial.requestPort();
    
    // Abre el puerto (9600 es la velocidad estándar de Arduino)
    await port.open({ baudRate: 9600 });

    // Configura el escritor para enviar texto
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    // Actualizar UI
    const btn = document.getElementById('connectArduinoBtn');
    if (btn) {
        btn.textContent = "✅ Arduino Conectado";
        btn.classList.remove("bg-gray-800", "hover:bg-gray-900");
        btn.classList.add("bg-green-600", "hover:bg-green-700");
        btn.disabled = true;
    }
    
    alert("Conexión exitosa con el dispositivo.");

  } catch (error) {
    console.error("Error al conectar:", error);
    alert("No se pudo conectar al Arduino. Asegúrate de usar Chrome/Edge y tener el dispositivo conectado.");
  }
}

// 2. Función para enviar datos al Arduino
async function sendToArduino(text) {
  if (!writer) {
    console.warn("Arduino no conectado. Saltando envío serial.");
    return;
  }

  try {
    // Enviamos el texto seguido de un salto de línea (\n) para que el Arduino sepa que terminó el mensaje
    await writer.write(text + "\n");
    console.log(`📡 Enviado a Arduino: ${text}`);
  } catch (error) {
    console.error("Error escribiendo en serial:", error);
    alert("Error de comunicación. Intenta reconectar.");
    writer = null; // Resetear para forzar reconexión
  }
}

// 3. Función de voz (TTS) existente
function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    window.speechSynthesis.speak(utterance);
  }
}

// 4. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    
    // Botón de conectar
    const connectBtn = document.getElementById('connectArduinoBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectArduino);
    }

    // Tarjetas de gestos
    const cards = document.querySelectorAll('.gesture-card'); // Asegúrate que tus tarjetas tengan esta clase o la que uses
    // Si usas otro selector en tu HTML, ajústalo aquí. Por ejemplo, si son <div> directos:
    // const cards = document.querySelectorAll('main > div.grid > div'); 

    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Obtenemos el texto del gesto (asumiendo que está en un <p> o <h3> dentro de la card)
            const text = card.getAttribute("data-text"); 
            //const text = textElement ? textElement.innerText.trim() : "Gesto";

            // A. Reproducir audio en el navegador
            speak(text);

            // B. Enviar comando al Arduino (para que actúe como bocina/display)
            sendToArduino(text);
        });
    });
});







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

