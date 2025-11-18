const API_URL = `http://localhost:3000/api/gestures`;

import { getAuthHeader } from "./stats.service.js";

const predictSequence = async (sequence) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ sequence }),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

// Función para enviar una secuencia de gestos etiquetada al backend
const collectSequence = async (label, sequence) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/collect`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ label, sequence }),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

export { predictSequence, collectSequence }; 