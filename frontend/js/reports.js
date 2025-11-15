// Load students
const students = JSON.parse(localStorage.getItem("students")) || []
const studentSelect = document.getElementById("studentSelect")
const totalStudentsEl = document.getElementById("totalStudents")

// Populate student select
students.forEach((student) => {
  const option = document.createElement("option")
  option.value = student.id
  option.textContent = student.name
  studentSelect.appendChild(option)
})

totalStudentsEl.textContent = students.length

// Generate report
const generateBtn = document.getElementById("generateBtn")
const reportContent = document.getElementById("reportContent")
const exportPDF = document.getElementById("exportPDF")
const exportCSV = document.getElementById("exportCSV")

generateBtn.addEventListener("click", () => {
  const studentId = studentSelect.value
  const period = document.getElementById("periodSelect").value
  const reportType = document.getElementById("reportType").value

  // Simulate report data
  const reportData = generateReportData(studentId, period, reportType)
  displayReport(reportData)

  // Enable export buttons
  exportPDF.disabled = false
  exportCSV.disabled = false
})

function generateReportData(studentId, period, reportType) {
  const periodText = {
    week: "última semana",
    month: "último mes",
    quarter: "último trimestre",
    year: "último año",
  }

  const typeText = {
    progress: "Progreso General",
    gestures: "Gestos Aprendidos",
    usage: "Frecuencia de Uso",
  }

  const student = studentId ? students.find((s) => s.id == studentId) : null
  const studentName = student ? student.name : "Todos los alumnos"

  // Simulated data
  return {
    title: typeText[reportType],
    student: studentName,
    period: periodText[period],
    data: [
      { label: "Gestos nuevos aprendidos", value: Math.floor(Math.random() * 20) + 10 },
      { label: "Sesiones completadas", value: Math.floor(Math.random() * 30) + 15 },
      { label: "Tiempo total de uso (horas)", value: (Math.random() * 10 + 5).toFixed(1) },
      { label: "Tasa de éxito (%)", value: Math.floor(Math.random() * 30) + 70 },
      { label: "Gestos más utilizados", value: "Hola, Gracias, Ayuda" },
    ],
    generatedDate: new Date().toLocaleString("es-ES"),
  }
}

function displayReport(data) {
  reportContent.innerHTML = `
    <div class="text-left space-y-6">
      <div class="border-b pb-4">
        <h4 class="text-2xl font-bold text-secondary">${data.title}</h4>
        <p class="text-gray-600 mt-1">${data.student} - ${data.period}</p>
        <p class="text-sm text-gray-500 mt-1">Generado: ${data.generatedDate}</p>
      </div>

      <div class="space-y-4">
        ${data.data
          .map(
            (item) => `
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span class="font-medium text-gray-700">${item.label}</span>
            <span class="text-lg font-bold text-secondary">${item.value}</span>
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p class="text-sm text-blue-700">
          <strong>Recomendación:</strong> El alumno muestra un progreso consistente. 
          Considere agregar gestos de nivel intermedio para continuar el desarrollo.
        </p>
      </div>
    </div>
  `
}

// Export PDF (simulated)
exportPDF.addEventListener("click", () => {
  alert("Exportando reporte como PDF...\n\nEn producción, esto generaría un archivo PDF con los datos del reporte.")
})

// Export CSV (simulated)
exportCSV.addEventListener("click", () => {
  alert("Exportando reporte como CSV...\n\nEn producción, esto generaría un archivo CSV con los datos del reporte.")
})
