import { getStudents, getReportData } from "../service/educator.service.js";

// DOM Elements
const generateBtn = document.getElementById("generateBtn");
/* const reportForm = document.getElementById('reportForm'); */
const studentSelect = document.getElementById("studentSelect");
const periodSelect = document.getElementById("periodSelect");
const reportTypeSelect = document.getElementById("reportType");
const reportContent = document.getElementById("reportContent");
const statusMessage = document.getElementById("statusMessage");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

let statsTableContainer;
let gesturesTableContainer;
// Variable global para guardar los datos cargados
let currentReportData = { stats: [], gestures: [] };

/**
 * Carga los alumnos en el <select>
 */
async function loadStudentsFilter() {
  const students = await getStudents();
  if (students.error) {
    console.error("Error cargando alumnos para filtro:", students.error);
    return;
  }

  // Limpia opciones (excepto la de "Todos")
  studentSelect.innerHTML =
    '<option value="all" selected>Todos los Alumnos</option>';

  students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student._id; // Usa _id
    option.textContent = `${student.username} (${student.email})`;
    studentSelect.appendChild(option);
  });
}

/**
 * Traduce el 'periodSelect' a fechas 'dateFrom' y 'dateTo'
 */
function getDateFiltersFromPeriod(periodValue) {
  const filters = { dateFrom: "", dateTo: "" };
  const today = new Date();
  let fromDate = new Date();

  if (periodValue === "week") {
    fromDate.setDate(today.getDate() - 7);
  } else if (periodValue === "month") {
    fromDate.setMonth(today.getMonth() - 1);
  } else if (periodValue === "quarter") {
    fromDate.setMonth(today.getMonth() - 3);
  } else if (periodValue === "year") {
    fromDate.setFullYear(today.getFullYear() - 1);
  } else {
    return {}; // Sin filtro de fecha
  }

  // Formato YYYY-MM-DD
  filters.dateFrom = fromDate.toISOString().split("T")[0];
  filters.dateTo = today.toISOString().split("T")[0];
  return filters;
}

/**
 * Manejador del botón "Generar Reporte"
 */
generateBtn.addEventListener("click", async (e) => {
  // <--- ¡ARREGLO! Escucha el 'click'
  e.preventDefault();

  const dateFilters = getDateFiltersFromPeriod(periodSelect.value);

  const filters = {
    studentId: studentSelect.value,
    dateFrom: dateFilters.dateFrom,
    dateTo: dateFilters.dateTo,
    // Ignoramos reportTypeSelect por ahora, ya que la API trae ambos
  };

  statusMessage.textContent = "Generando reporte...";
  statusMessage.classList.remove("hidden", "text-red-600");
  statusMessage.classList.add("text-gray-700"); // Un color neutral

  const data = await getReportData(filters);

  if (data.error) {
    statusMessage.textContent = `Error: ${data.error}`;
    statusMessage.classList.add("text-red-600");
    currentReportData = { stats: [], gestures: [] }; // Limpia datos en error
    reportContent.innerHTML = `<p class="text-center text-red-500">Error al generar reporte.</p>`; // Limpia tablas
  } else {
    statusMessage.classList.add("hidden");
    currentReportData = data; // Guarda los datos globalmente
    renderReport(data);
  }
});

/**
 * Renderiza los datos del reporte en las tablas
 */
function renderReport(data) {
  // Limpia el contenido anterior
  reportContent.innerHTML = "";
  reportContent.classList.remove("text-center", "py-12", "text-gray-400"); // Quita el estilo "placeholder"

  // --- 1. Renderizar Resumen de Estadísticas ---
  reportContent.innerHTML += `
    <h4 class="text-lg font-bold text-secondary mb-3">Resumen de Uso</h4>
    <div class="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
      <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-white uppercase bg-secondary">
          <tr>
            <th scope="col" class="px-6 py-3">Usuario</th>
            <th scope="col" class="px-6 py-3">Email</th>
            <th scope="col" class="px-6 py-3">Palabras Traducidas</th>
            <th scope="col" class="px-6 py-3">Tiempo de Uso</th>
          </tr>
        </thead>
        <tbody id="statsSummaryContainer"> 
          </tbody>
      </table>
    </div>
  `;
  statsTableContainer = document.getElementById("statsSummaryContainer");

  if (data.stats.length === 0) {
    statsTableContainer.innerHTML = `
      <tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No hay estadísticas de uso para esta selección.</td></tr>
    `;
  } else {
    data.stats.forEach((stat) => {
      const hours = Math.floor(stat.totalTime / 3600);
      const minutes = Math.floor((stat.totalTime % 3600) / 60);
      const timeString = `${hours}h ${minutes}m`;
      statsTableContainer.innerHTML += `
        <tr class="bg-white border-b">
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${stat.username}</th>
          <td class="px-6 py-4">${stat.email}</td>
          <td class="px-6 py-4">${stat.totalWords}</td>
          <td class="px-6 py-4">${timeString}</td>
        </tr>
      `;
    });
  }

  // --- 2. Renderizar Gestos más Usados ---
  reportContent.innerHTML += `
    <h4 class="text-lg font-bold text-secondary mb-3">Gestos Más Usados</h4>
    <div class="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-white uppercase bg-primary">
          <tr>
            <th scope="col" class="px-6 py-3">Gesto</th>
            <th scope="col" class="px-6 py-3">Usuario</th>
            <th scope="col" class="px-6 py-3">Conteo</th>
          </tr>
        </thead>
        <tbody id="gesturesListContainer">
          </tbody>
      </table>
    </div>
  `;
  gesturesTableContainer = document.getElementById("gesturesListContainer");

  if (data.gestures.length === 0) {
    gesturesTableContainer.innerHTML = `
      <tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No se han registrado gestos para esta selección.</td></tr>
    `;
  } else {
    data.gestures.forEach((gesture) => {
      gesturesTableContainer.innerHTML += `
        <tr class="bg-white border-b">
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${gesture.label}</th>
          <td class="px-6 py-4">${gesture.username}</td>
          <td class="px-6 py-4">${gesture.count}</td>
        </tr>
      `;
    });
  }

  // --- 3. Renderizar Gestos Aprendidos (Nuevas Adquisiciones) ---
  reportContent.innerHTML += `
    <div class="mt-8">
      <h4 class="text-lg font-bold text-secondary mb-3">Progreso: Nuevos Gestos Aprendidos</h4>
      <p class="text-sm text-gray-500 mb-2">Gestos utilizados por primera vez en este periodo.</p>
      <div class="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-white uppercase bg-green-600">
            <tr>
              <th scope="col" class="px-6 py-3">Gesto</th>
              <th scope="col" class="px-6 py-3">Usuario</th>
              <th scope="col" class="px-6 py-3">Fecha de Aprendizaje</th>
            </tr>
          </thead>
          <tbody id="learnedGesturesContainer">
            </tbody>
        </table>
      </div>
    </div>
  `;
  const learnedContainer = document.getElementById("learnedGesturesContainer");

  if (!data.learnedGestures || data.learnedGestures.length === 0) {
    learnedContainer.innerHTML = `
      <tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No se registraron nuevos aprendizajes en este periodo.</td></tr>
    `;
  } else {
    data.learnedGestures.forEach((item) => {
      const date = new Date(item.firstRecognized).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      learnedContainer.innerHTML += `
        <tr class="bg-white border-b">
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
            ${item.label} <span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Nuevo</span>
          </th>
          <td class="px-6 py-4">${item.username}</td>
          <td class="px-6 py-4">${date}</td>
        </tr>
      `;
    });
  }
}

/**
 * Función para exportar datos a CSV
 */
function exportToCSV() {
  const { stats, gestures, learnedGestures } = currentReportData;
  if (
    stats.length === 0 &&
    gestures.length === 0 &&
    learnedGestures.length === 0
  ) {
    alert("No hay datos para exportar.");
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,";

  // Título para Estadísticas
  csvContent += "Resumen de Estadisticas\n";
  csvContent += "Username,Email,Palabras Traducidas,Tiempo de Uso (seg)\n";
  stats.forEach((stat) => {
    csvContent += `${stat.username},${stat.email},${stat.totalWords},${stat.totalTime}\n`;
  });

  // Título para Gestos
  csvContent += "\nGestos Mas Usados\n";
  csvContent += "Gesto,Usuario,Conteo\n";
  gestures.forEach((gesture) => {
    csvContent += `${gesture.label},${gesture.username},${gesture.count}\n`;
  });

  // Título para Gestos Aprendidos
  csvContent += "\nProgreso - Nuevos Gestos Aprendidos\n";
  csvContent += "Gesto,Usuario,Fecha de Aprendizaje\n";
  learnedGestures.forEach((gesture) => {
    const date = new Date(gesture.firstRecognized).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    csvContent += `${gesture.label},${gesture.username},${date}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "reporte_realgest.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Función para exportar datos a PDF
 */
function exportToPDF() {
  const { stats, gestures, learnedGestures } = currentReportData;
  if (stats.length === 0 && gestures.length === 0 && learnedGestures.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  // Usamos la variable global de jspdf
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const title = "Reporte de Actividad - RealGest";
  const date = `Generado el: ${new Date().toLocaleDateString("es-ES")}`;

  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(date, 14, 28);

  // Tabla de Estadísticas
  const statsBody = stats.map((stat) => {
    const hours = Math.floor(stat.totalTime / 3600);
    const minutes = Math.floor((stat.totalTime % 3600) / 60);
    const timeString = `${hours}h ${minutes}m`;
    return [stat.username, stat.email, stat.totalWords, timeString];
  });

  doc.autoTable({
    startY: 35,
    head: [["Resumen de Estadísticas"]],
    body: [],
    theme: "plain",
    styles: { fontSize: 14, fontStyle: "bold" },
  });

  doc.autoTable({
    head: [["Usuario", "Email", "Palabras Traducidas", "Tiempo de Uso"]],
    body: statsBody,
    theme: "grid",
    styles: { cellPadding: 2, fontSize: 10 },
    headStyles: { fillColor: [24, 65, 109] }, // Color #18416d (secondary)
  });

  // Tabla de Gestos
  const gesturesBody = gestures.map((g) => [g.label, g.username, g.count]);

  doc.autoTable({
    // Usa la posición final de la tabla anterior
    startY: doc.autoTable.previous.finalY + 10,
    head: [["Gestos Más Usados"]],
    body: [],
    theme: "plain",
    styles: { fontSize: 14, fontStyle: "bold" },
  });

  doc.autoTable({
    head: [["Gesto", "Usuario", "Conteo"]],
    body: gesturesBody,
    theme: "grid",
    styles: { cellPadding: 2, fontSize: 10 },
    headStyles: { fillColor: [85, 196, 189] }, // Color #55c4bd (primary)
  });

  //Tabla de Gestos Aprendidos
  const learnedBody = learnedGestures.map(item => {
        const dateStr = new Date(item.firstRecognized).toLocaleDateString("es-ES");
        return [item.label, item.username, dateStr];
      });

  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 10,
    head: [["Progreso - Nuevos Gestos Aprendidos"]],
    body: [],
    theme: "plain",
    styles: { fontSize: 14, fontStyle: "bold" },
  });

  doc.autoTable({
    head: [["Gesto", "Usuario", "Fecha de Aprendizaje"]],
    body: learnedBody,
    theme: "grid",
    styles: { cellPadding: 2, fontSize: 10 },
    headStyles: { fillColor: [22, 163, 74] }, // Color verde
  });
  

  doc.save("reporte_realgest.pdf");
}

exportCsvBtn.addEventListener("click", exportToCSV);
exportPdfBtn.addEventListener("click", exportToPDF);

// Carga inicial de filtros
loadStudentsFilter().then(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const studentIdParam = urlParams.get("studentId");

  if (studentIdParam) {
    // 1. Seleccionar al alumno en el dropdown
    studentSelect.value = studentIdParam;
    periodSelect.value = "month";
    generateBtn.click();
  }
});

// Carga un reporte vacío al inicio
renderReport({ stats: [], gestures: [] });
