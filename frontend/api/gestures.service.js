const API_URL = `http://localhost:3000/api/gestures/`;

const sendToBackend = async (landmarks) => {
  try {
    const response = await fetch(`${API_URL}landmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(landmarks),
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
  try {
    const response = await fetch(`${API_URL}collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, sequence }),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

export { sendToBackend, collectSequence }; 