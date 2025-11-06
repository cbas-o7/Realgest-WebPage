const API_URL = `http://localhost:3000/api/`;

const sendToBackend = async (landmarks) => {
  try {
    const response = await fetch(`${API_URL}gestures/landmarks`, {
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

export { sendToBackend };
