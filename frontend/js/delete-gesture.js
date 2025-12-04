import { listGesture, deleteGestureDB } from '../service/gestures.service.js';
import { requireAuth } from "./auth.guard.js";

requireAuth(['educador']);

let allGestures = [];
let sort = false 

// DOM Elements
const tableBody = document.getElementById('gesturesTableBody');
const statusMessage = document.getElementById('statusMessage');
const searchInput = document.getElementById('searchGesture');
const sortByName = document.getElementById("sortByName")

function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `p-4 mb-4 rounded-lg ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    statusMessage.classList.remove('hidden');
    setTimeout(() => statusMessage.classList.add('hidden'), 4000);
}

// Función para renderizar la tabla
function renderTable(gesturesData) {
    tableBody.innerHTML = '';
    
    if (gesturesData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No se encontraron gestos.</td></tr>';
        return;
    }

    gesturesData.forEach(g => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${g.label}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500">${g.samples} muestras</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                <button class="delete-btn text-red-600 hover:text-red-900 font-bold" data-label="${g.label}">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Re-asignar listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteGesture(e.target.dataset.label));
    });
}

async function loadGestures() {
    try {
        const response = await listGesture();
        allGestures = response;
        renderTable(allGestures);
        
        } catch (error) {
        console.error(error);
        showStatus('Error al cargar gestos', 'error');
    }
}

// NUEVO: Listener para el filtro
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allGestures.filter(g => g.label.toLowerCase().includes(term));
    renderTable(filtered);
});

sortByName.addEventListener('click', () => {
  // alterna el estado de ordenamiento
  sort = !sort;

  if (sort) {
    // crear copia ordenada y renderizarla
    const sorted = [...allGestures].sort((a, b) => a.label.localeCompare(b.label));
    sortByName.classList.add("bg-primary", "text-white");
    sortByName.classList.remove("hover:bg-gray-50");
    renderTable(sorted);
  } else {
    // restaurar orden original y renderizar
    sortByName.classList.remove("bg-primary", "text-white");
    sortByName.classList.add("hover:bg-gray-50");
    renderTable(allGestures);
  }
});


// Delete gesture function (called from the delete buttons in renderTable)
async function deleteGesture(label) {
    if (!confirm(`¿Estás seguro de eliminar el gesto "${label}"? Esta acción no se puede deshacer.`)) return;

    try {
        const response = await deleteGestureDB(label);
        const result = response;

        if (result.ok) {
            showStatus(`Gesto eliminado. Muestras borradas: ${result.details.datasetSamplesRemoved}`, 'success');
            loadGestures(); // Recargar tabla
        } else {
            showStatus(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error(error);
        showStatus('Error de conexión', 'error');
    }
}

loadGestures();

