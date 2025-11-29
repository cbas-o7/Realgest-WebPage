import { getStudents, addStudent, updateStudent } from '../service/educator.service.js';

// DOM Elements
const addStudentForm = document.getElementById('addStudentForm');
const studentEmail = document.getElementById('studentEmail');
const vocabularyLevel = document.getElementById('vocabularyLevel');
const studentsList = document.getElementById('studentsList');
const studentCount = document.getElementById('studentCount');
const statusMessage = document.getElementById('statusMessage');

let currentStudents = [];

/**
 * Muestra un mensaje de estado (éxito o error)
 */
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.remove('hidden', 'text-green-600', 'text-red-600');
  if (isError) {
    statusMessage.classList.add('text-red-600');
  } else {
    statusMessage.classList.add('text-green-600');
  }
  // Oculta el mensaje después de 3 segundos
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}

/**
 * Renderiza la lista de alumnos en la tabla
 */
function renderStudents(students) {
  currentStudents = students;
  studentCount.textContent = students.length;
  studentsList.innerHTML = ''; // Limpiar lista

  if (students.length === 0) {
    studentsList.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          No tienes alumnos asignados.
        </td>
      </tr>
    `;
    return;
  }

  students.forEach(student => {
    const row = document.createElement('tr');
    row.className = 'bg-white border-b';
    row.innerHTML = `
      <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
        ${student.username}
      </th>
      <td class="px-6 py-4">
        ${student.email}
      </td>
      <td class="px-6 py-4">
        <select data-id="${student._id}" class="level-select bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
          <option value="basico" ${student.vocabularyLevel === 'basico' ? 'selected' : ''}>Básico</option>
          <option value="intermedio" ${student.vocabularyLevel === 'intermedio' ? 'selected' : ''}>Intermedio</option>
          <option value="avanzado" ${student.vocabularyLevel === 'avanzado' ? 'selected' : ''}>Avanzado</option>
        </select>
      </td>
      <td class="px-6 py-4 text-right">
        <a href="./reports.html?studentId=${student._id}" class="font-medium text-secondary hover:underline">Ver Reporte</a>
      </td>
    `;
    studentsList.appendChild(row);
  });
}

/**
 * Carga la lista inicial de alumnos
 */
async function loadStudents() {
  const result = await getStudents();
  if (result.error) {
    showStatus(`Error al cargar alumnos: ${result.error}`, true);
  } else {
    renderStudents(result);
  }
}

/**
 * Manejador para agregar un nuevo alumno
 */
addStudentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = studentEmail.value;
  const level = vocabularyLevel.value;

  if (!email || !level) {
    showStatus("Por favor, completa todos los campos.", true);
    return;
  }

  const result = await addStudent(email, level);
  
  if (result.error) {
    showStatus(`Error: ${result.error}`, true);
  } else {
    showStatus(`Alumno ${result.username} agregado exitosamente.`, false);
    addStudentForm.reset();
    loadStudents(); // Recargar la lista
  }
});

/**
 * Manejador para cambiar el nivel de un alumno (delegación de eventos)
 */
studentsList.addEventListener('change', async (e) => {
  if (e.target.classList.contains('level-select')) {
    const studentId = e.target.dataset.id;
    const newLevel = e.target.value;
    
    const result = await updateStudent(studentId, newLevel);
    if (result.error) {
      showStatus(`Error al actualizar: ${result.error}`, true);
      // Revertir el cambio visual
      loadStudents();
    } else {
      showStatus(`Nivel de ${result.username} actualizado a ${result.vocabularyLevel}.`, false);
    }
  }
});

// Carga inicial
loadStudents();
/* 
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
renderStudents() */
