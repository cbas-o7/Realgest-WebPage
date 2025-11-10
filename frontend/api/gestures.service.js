const API_URL = `http://localhost:3000/api/gestures/`;

const predictSequence = async (sequence) => {
  try {
    const response = await fetch(`${API_URL}predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

export { predictSequence, collectSequence }; 