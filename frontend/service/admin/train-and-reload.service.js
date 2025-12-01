import { getAuthHeader } from "../stats.service.js";
import { API_URL } from "../../js/config.js";


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
