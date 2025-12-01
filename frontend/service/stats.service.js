import { API_URL } from "../js/config.js";

// Función para obtener el User ID de localStorage
function getAuthHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id) {
    console.error("No hay ID de usuario en localStorage");
    // Redirigir a login si no hay usuario
        window.location.href = '../index.html'; 
    
    return null;
  }
  return {
    "Content-Type": "application/json",
    "x-user-id": user.id 
  };
}

// Obtener datos para el dashboard
const getDashboardStats = async () => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/stats/dashboard`, {
      method: "GET",
      headers: headers,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; 
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

// Guardar datos de la sesión
const updateStats = async (words, time) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/stats/update`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ words, time }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

export { getDashboardStats, updateStats, getAuthHeader };