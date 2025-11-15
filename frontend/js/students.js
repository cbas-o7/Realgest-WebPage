// Initialize students from localStorage
const students = JSON.parse(localStorage.getItem("students")) || []

// DOM elements
const addStudentForm = document.getElementById("addStudentForm")
const studentsList = document.getElementById("studentsList")
const studentCount = document.getElementById("studentCount")
const searchStudents = document.getElementById("searchStudents")
const addStatus = document.getElementById("addStatus")
const studentModal = document.getElementById("studentModal")
const closeModal = document.getElementById("closeModal")
const modalContent = document.getElementById("modalContent")

// Render students list
function renderStudents(studentsToRender = students) {
  studentCount.textContent = students.length

  if (studentsToRender.length === 0) {
    studentsList.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <div class="text-6xl mb-3">👥</div>
        <p class="font-medium text-lg">No hay alumnos registrados</p>
        <p class="text-sm mt-1">Agrega tu primer alumno para comenzar</p>
      </div>
    `
    return
  }

  studentsList.innerHTML = studentsToRender
    .map(
      (student, index) => `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 flex-1">
          <div class="w-12 h-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center text-primary font-bold text-lg">
            ${student.name.charAt(0)}
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-gray-800 text-lg">${student.name}</h4>
            <p class="text-sm text-gray-500">${student.email}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2 py-1 rounded-full ${getLevelColor(student.level)}">${getLevelText(student.level)}</span>
              <span class="text-xs text-gray-500">${student.gesturesCount || 0} gestos</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="viewStudent(${index})" class="bg-secondary hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Ver Detalles
          </button>
          <button onclick="deleteStudent(${index})" class="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

// Helper functions
function getLevelColor(level) {
  const colors = {
    basico: "bg-green-100 text-green-700",
    intermedio: "bg-yellow-100 text-yellow-700",
    avanzado: "bg-blue-100 text-blue-700",
  }
  return colors[level] || "bg-gray-100 text-gray-700"
}

function getLevelText(level) {
  const texts = {
    basico: "Básico",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
  }
  return texts[level] || level
}

// Add student
addStudentForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const name = document.getElementById("studentName").value.trim()
  const email = document.getElementById("studentEmail").value.trim()
  const level = document.getElementById("studentLevel").value

  // Check if email already exists
  if (students.some((s) => s.email === email)) {
    showStatus("error", "Este correo ya está registrado")
    return
  }

  const newStudent = {
    id: Date.now(),
    name,
    email,
    level,
    gesturesCount: 0,
    addedDate: new Date().toISOString(),
  }

  students.push(newStudent)
  localStorage.setItem("students", JSON.stringify(students))

  addStudentForm.reset()
  renderStudents()
  showStatus("success", "Alumno agregado exitosamente")
})

// Search students
searchStudents.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase()
  const filtered = students.filter((s) => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query))
  renderStudents(filtered)
})

// View student details
function viewStudent(index) {
  const student = students[index]

  modalContent.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
          ${student.name.charAt(0)}
        </div>
        <div>
          <h4 class="text-xl font-bold text-gray-800">${student.name}</h4>
          <p class="text-gray-600">${student.email}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-1">Nivel</p>
          <p class="text-lg font-bold text-secondary">${getLevelText(student.level)}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-1">Gestos Aprendidos</p>
          <p class="text-lg font-bold text-primary">${student.gesturesCount || 0}</p>
        </div>
      </div>

      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="text-sm text-gray-600 mb-1">Fecha de registro</p>
        <p class="font-medium">${new Date(student.addedDate).toLocaleDateString("es-ES")}</p>
      </div>

      <div class="flex gap-3">
        <button onclick="editLevel(${index})" class="flex-1 bg-secondary hover:bg-opacity-90 text-white py-2 rounded-lg font-medium">
          Cambiar Nivel
        </button>
      </div>
    </div>
  `

  studentModal.classList.remove("hidden")
  studentModal.classList.add("flex")
}

// Close modal
closeModal.addEventListener("click", () => {
  studentModal.classList.add("hidden")
  studentModal.classList.remove("flex")
})

// Delete student
function deleteStudent(index) {
  const student = students[index]
  if (confirm(`¿Estás seguro de eliminar a ${student.name}?`)) {
    students.splice(index, 1)
    localStorage.setItem("students", JSON.stringify(students))
    renderStudents()
    showStatus("success", "Alumno eliminado")
  }
}

// Edit level
function editLevel(index) {
  const student = students[index]
  const newLevel = prompt(
    `Cambiar nivel de ${student.name}:\n1. Básico\n2. Intermedio\n3. Avanzado\n\nEscribe el número:`,
  )

  const levels = { 1: "basico", 2: "intermedio", 3: "avanzado" }
  if (levels[newLevel]) {
    students[index].level = levels[newLevel]
    localStorage.setItem("students", JSON.stringify(students))
    viewStudent(index)
    renderStudents()
  }
}

// View gestures (placeholder)
function viewGestures(index) {
  const student = students[index]
  alert(`Función en desarrollo: Ver gestos de ${student.name}`)
}

// Show status message
function showStatus(type, message) {
  addStatus.className = `mt-4 p-3 rounded-lg ${type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`
  addStatus.querySelector("p").textContent = message
  addStatus.classList.remove("hidden")

  setTimeout(() => {
    addStatus.classList.add("hidden")
  }, 3000)
}

// Initial render
renderStudents()
