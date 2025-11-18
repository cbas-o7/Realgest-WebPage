import { getEducatorDashboardStats } from '../api/educator.service.js';

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const userNameEl = document.getElementById('userName');
const totalGesturesEl = document.getElementById('totalGestures');
const totalStudentsEl = document.getElementById('totalStudents');
const recentStudentsListEl = document.getElementById('recentStudentsList');

// Cargar datos del dashboard
async function loadDashboardStats() {
    // Cargar nombre de usuario
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.username) {
        userNameEl.textContent = user.username;
    }

    // Cargar estadísticas
    const result = await getEducatorDashboardStats();
    if (result.error) {
        console.error("Error al cargar stats:", result.error);
        totalGesturesEl.textContent = 'Error';
        totalStudentsEl.textContent = 'Error';
        recentStudentsListEl.innerHTML = '<p class="text-red-500 text-center">Error al cargar alumnos.</p>';
        return;
    }

    // Poblar las tarjetas de estadísticas
    totalGesturesEl.textContent = result.totalGestures;
    totalStudentsEl.textContent = result.totalStudents;

    // Poblar la lista de alumnos recientes
    recentStudentsListEl.innerHTML = ''; // Limpiar "Cargando..."
    if (result.recentStudents.length === 0) {
        recentStudentsListEl.innerHTML = '<p class="text-gray-500 text-center py-4">No tienes alumnos asignados.</p>';
        return;
    }

    result.recentStudents.forEach(student => {
        // Genera iniciales (ej. Juan Pérez -> JP)
        const initials = student.username.split(' ').map(n => n[0]).join('').toUpperCase();
        
        recentStudentsListEl.innerHTML += `
            <div class="flex items-center gap-4 pb-4 border-b">
                <div
                    class="w-10 h-10 bg-primary bg-opacity-20 rounded-full flex items-center justify-center text-primary font-bold">
                    ${initials}
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-gray-800">${student.username}</p>
                    <p class="text-sm text-gray-500">
                        Nivel ${student.vocabularyLevel} - ${student.email}
                    </p>
                </div>
                <a href="./reports.html?studentId=${student._id}" class="text-secondary hover:text-primary font-medium text-sm">
                    Ver progreso
                </a>
            </div>
        `;
    });
}

// Logout
logoutBtn.addEventListener('click', () => {
  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?")

  if (confirmLogout) {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    window.location.href = "../../index.html"; 
  }
});

// Carga inicial
loadDashboardStats();