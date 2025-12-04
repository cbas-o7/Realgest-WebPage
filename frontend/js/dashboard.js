import { getDashboardStats } from "../service/stats.service.js";
import { requireAuth } from "./auth.guard.js";

const logoutBtn = document.getElementById("logoutBtn")
const wordsCountEl = document.getElementById("wordsCount");
const timeUsageEl = document.getElementById("timeUsage");
const userNameEl = document.getElementById("userName");
const gesturesEl = document.getElementById("gesturesRegistered");

const user = requireAuth(['usuario']);

logoutBtn.addEventListener("click", () => {
  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?")

  if (confirmLogout) {
    // Redirect to landing page
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    window.location.href = "../index.html"
  }
})

async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (userNameEl && user) {
    userNameEl.textContent = user.username || "Usuario";
  }

  const result = await getDashboardStats();
  if (result.error) {
    console.error("Error al cargar stats:", result.error);
    wordsCountEl.textContent = "N/A";
    timeUsageEl.textContent = "N/A";
    gesturesEl.textContent = "N/A";
  } else {
    wordsCountEl.textContent = result.totalWords;
    timeUsageEl.textContent = result.totalTime;
    gesturesEl.textContent = result.totalGestures;
  }
}

loadDashboard();
