// Logout button
const logoutBtn = document.getElementById("logoutBtn")

logoutBtn.addEventListener("click", () => {
  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?")

  if (confirmLogout) {
    // Redirect to landing page
    window.location.href = "../index.html"
  }
})