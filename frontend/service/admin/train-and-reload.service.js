import { getAuthHeader } from "../stats.service.js";

const API_URL =  process.env.API_URL || `http://localhost:3000/api`;

const train = async (newUser) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/admin/train-and-reload`, {
      method: "POST",
      headers: headers,
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

export { train };
