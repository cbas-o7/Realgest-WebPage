import { login, register } from "../api/auth.service.js";

// Modal elements
const authModal = document.getElementById("authModal")
const openModalBtn = document.getElementById("openModalBtn")
const openModalBtn2 = document.getElementById("openModalBtn2")
const closeModalBtn = document.getElementById("closeModalBtn")

// Tab elements
const loginTab = document.getElementById("loginTab")
const registerTab = document.getElementById("registerTab")

// Form elements
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const errorMessage = document.getElementsByClassName("error-message");

// contenedor de aviso offline
let offlineBanner;

// Función para crear el banner de aviso
function showOfflineBanner() {
  if (!offlineBanner) {
    offlineBanner = document.createElement("div");
    offlineBanner.textContent = "⚠️ Estás sin conexión. El inicio de sesión requiere estar en línea.";
    offlineBanner.className = "bg-yellow-100 text-yellow-800 text-center p-3 font-medium";
    document.body.prepend(offlineBanner);
  }
}

// Función para eliminar el banner
function hideOfflineBanner() {
  if (offlineBanner) {
    offlineBanner.remove();
    offlineBanner = null;
  }
}

// 🟢 Detectar conexión al cargar
function checkConnection() {
  if (!navigator.onLine) {
    showOfflineBanner();
    disableForms(true);
  } else {
    hideOfflineBanner();
    disableForms(false);
  }
}

// 🟢 Habilitar o deshabilitar forms
function disableForms(state) {
  const loginButton = loginForm.querySelector("button[type='submit']");
  const registerButton = registerForm.querySelector("button[type='submit']");
  loginButton.disabled = state;
  registerButton.disabled = state;

  if (state) {
    loginButton.classList.add("opacity-50", "cursor-not-allowed");
    registerButton.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    loginButton.classList.remove("opacity-50", "cursor-not-allowed");
    registerButton.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

// Escuchar eventos de conexión
window.addEventListener("online", checkConnection);
window.addEventListener("offline", checkConnection);

// Revisar conexión al inicio
checkConnection();


// Open modal
openModalBtn.addEventListener("click", () => { authModal.classList.remove("hidden") })

openModalBtn2.addEventListener("click", () => { authModal.classList.remove("hidden")})

// Close modal
closeModalBtn.addEventListener("click", () => {  authModal.classList.add("hidden")})

// Close modal when clicking outside
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) { authModal.classList.add("hidden")}
})

// Si ya está logeado, saltar directamente al dashboard
if (localStorage.getItem("isLoggedIn") === "true") {
  window.location.href = "html/dashboard.html";
}

// Switch to login tab
loginTab.addEventListener("click", () => {
  loginTab.classList.add("text-secondary", "border-secondary")
  loginTab.classList.remove("text-gray-400", "border-transparent")

  registerTab.classList.add("text-gray-400", "border-transparent")
  registerTab.classList.remove("text-secondary", "border-secondary")

  loginForm.classList.remove("hidden")
  registerForm.classList.add("hidden")
})

// Switch to register tab
registerTab.addEventListener("click", () => {
  registerTab.classList.add("text-secondary", "border-secondary")
  registerTab.classList.remove("text-gray-400", "border-transparent")

  loginTab.classList.add("text-gray-400", "border-transparent")
  loginTab.classList.remove("text-secondary", "border-secondary")

  registerForm.classList.remove("hidden")
  loginForm.classList.add("hidden")
})

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  errorMessage[0].textContent = "";
  // Verificar conexión a Internet
  if (navigator.onLine === false) { 
    errorMessage[0].textContent = "⚠️ No tienes conexión a Internet.";
    return;
  }

  // Get form data
  const formData = new FormData(loginForm)
  const email = loginForm.querySelector('input[type="email"]').value
  const password = loginForm.querySelector('input[type="password"]').value

  const result = await login({ email, password });

  if (result.error) {
    errorMessage[0].textContent = result.error;
  } else {
    /// Guardar sesión en localStorage
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify(result.user));
    
    if (result.user.role === "educador") {
      window.location.href = "html/educator/educator.html";
    } else {
      window.location.href = "html/dashboard.html";
    }

  }
})

// Handle register form submission
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  errorMessage[1].textContent = "";

  // Get form data
  const role = registerForm.querySelector("select").value
  const username = registerForm.querySelector('input[type="text"]').value
  const email = registerForm.querySelector('input[type="email"]').value
  const password = registerForm.querySelector('input[type="password"]').value

  //console.log("Register attempt:", { role, username, email, password })

  const result = await register({ role, username, email, password });

  if (result.error) {
    errorMessage[1].textContent = result.error;
  } else {
    /// Guardar sesión en localStorage
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify(result.user));
    
    if (result.user.role === "educador") {
      window.location.href = "html/educator/educator.html";
    } else {
      window.location.href = "html/dashboard.html";
    }
    
  }
})
