import { getAuthHeader } from "./stats.service.js"; 
import { API_URL } from "../js/config.js";

/**
 * Obtiene datos para el dashboard del educador.
 */
const getEducatorDashboardStats = async () => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/educator/dashboard-stats`, {
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

/**
 * Obtiene la lista de alumnos asignados al educador actual.
 */
const getStudents = async () => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/educator/students`, {
      method: "GET",
      headers: headers,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; // Devuelve un array de alumnos
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

/**
 * Agrega un nuevo alumno (por email) a la lista del educador.
 */
const addStudent = async (email, vocabularyLevel) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/educator/add-student`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ email, vocabularyLevel }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; // Devuelve el alumno agregado
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

/**
 * Actualiza el nivel de vocabulario de un alumno.
 */
const updateStudent = async (studentId, vocabularyLevel) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };

  try {
    const response = await fetch(`${API_URL}/educator/student/${studentId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ vocabularyLevel }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; // Devuelve el alumno actualizado
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

/**
 * Obtiene los datos para los reportes, con filtros.
 * @param {object} filters - { studentId, dateFrom, dateTo }
 */
const getReportData = async (filters) => {
  const headers = getAuthHeader();
  if (!headers) return { error: "No autenticado" };
  
  // Construir query string
  const params = new URLSearchParams();
  if (filters.studentId) params.append('studentId', filters.studentId);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);

  try {
    const response = await fetch(`${API_URL}/educator/reports?${params.toString()}`, {
      method: "GET",
      headers: headers,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; // Devuelve { stats: [...], gestures: [...] }
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};


export { getEducatorDashboardStats, getStudents, addStudent, updateStudent, getReportData };