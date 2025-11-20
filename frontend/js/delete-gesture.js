let savedGestures = []
let currentSort = "date" // 'date' or 'name'

// DOM Elements
const gesturesList = document.getElementById("gesturesList")
const totalGestures = document.getElementById("totalGestures")
const searchGestures = document.getElementById("searchGestures")
const sortByName = document.getElementById("sortByName")
const sortByDate = document.getElementById("sortByDate")
const deleteAllBtn = document.getElementById("deleteAllBtn")
const logoutBtn = document.getElementById("logoutBtn")

// Load saved gestures from localStorage
function loadSavedGestures() {
  const stored = localStorage.getItem("realgest_gestures")
  if (stored) {
    savedGestures = JSON.parse(stored)
    updateGesturesList()
  }
}

// Sort Gestures
function sortGestures(gestures, sortBy) {
  const sorted = [...gestures]

  if (sortBy === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    sorted.sort((a, b) => b.timestamp - a.timestamp)
  }

  return sorted
}

// Update Gestures List
function updateGesturesList() {
  totalGestures.textContent = savedGestures.length
  deleteAllBtn.disabled = savedGestures.length === 0

  if (savedGestures.length === 0) {
    gesturesList.innerHTML = `
      <div class="text-center py-16 text-gray-400">
        <div class="text-6xl mb-4">🗑️</div>
        <p class="text-lg font-medium">No hay gestos guardados</p>
        <p class="text-sm mt-2">Los gestos que se creen aparecerán aquí</p>
      </div>
    `
    return
  }

  const searchTerm = searchGestures.value.toLowerCase()
  const filteredGestures = savedGestures.filter((gesture) => gesture.name.toLowerCase().includes(searchTerm))

  if (filteredGestures.length === 0) {
    gesturesList.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <div class="text-4xl mb-3">🔍</div>
        <p class="font-medium">No se encontraron gestos</p>
        <p class="text-sm mt-1">Intenta con otro término de búsqueda</p>
      </div>
    `
    return
  }

  const sortedGestures = sortGestures(filteredGestures, currentSort)

  gesturesList.innerHTML = sortedGestures
    .map((gesture) => {
      const date = new Date(gesture.timestamp)
      const formattedDate = date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      return `
        <div class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors group">
          <div class="flex-shrink-0">
            ${
              gesture.imageData
                ? `<img src="${gesture.imageData}" alt="${gesture.name}" class="w-20 h-20 object-cover rounded-lg border-2 border-gray-200">`
                : `<div class="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center text-3xl">👋</div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 text-lg truncate">${gesture.name}</h3>
            <p class="text-sm text-gray-500 mt-1">📅 ${formattedDate}</p>
          </div>
          <button 
            onclick="deleteGesture(${savedGestures.indexOf(gesture)})" 
            class="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 group-hover:scale-105"
          >
            <span class="text-lg">🗑️</span>
            Eliminar
          </button>
        </div>
      `
    })
    .join("")
}

// Delete Single Gesture
window.deleteGesture = (index) => {
  const gesture = savedGestures[index]

  if (confirm(`¿Estás seguro de que deseas eliminar el gesto "${gesture.name}"?`)) {
    savedGestures.splice(index, 1)
    localStorage.setItem("realgest_gestures", JSON.stringify(savedGestures))
    updateGesturesList()

    // Show success message
    showNotification(`Gesto "${gesture.name}" eliminado correctamente`, "success")
  }
}

// Delete All Gestures
deleteAllBtn.addEventListener("click", () => {
  if (
    confirm(
      `¿Estás seguro de que deseas eliminar TODOS los ${savedGestures.length} gestos? Esta acción no se puede deshacer.`,
    )
  ) {
    savedGestures = []
    localStorage.setItem("realgest_gestures", JSON.stringify(savedGestures))
    updateGesturesList()

    // Show success message
    showNotification("Todos los gestos han sido eliminados", "success")
  }
})

// Show Notification
function showNotification(message, type) {
  const notification = document.createElement("div")
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transform transition-all duration-300 ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  }`
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.opacity = "0"
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// Sort Event Listeners
sortByName.addEventListener("click", () => {
  currentSort = "name"
  sortByName.classList.add("bg-primary", "text-white")
  sortByName.classList.remove("hover:bg-gray-50")
  sortByDate.classList.remove("bg-primary", "text-white")
  sortByDate.classList.add("hover:bg-gray-50")
  updateGesturesList()
})

sortByDate.addEventListener("click", () => {
  currentSort = "date"
  sortByDate.classList.add("bg-primary", "text-white")
  sortByDate.classList.remove("hover:bg-gray-50")
  sortByName.classList.remove("bg-primary", "text-white")
  sortByName.classList.add("hover:bg-gray-50")
  updateGesturesList()
})

// Search Event Listener
searchGestures.addEventListener("input", updateGesturesList)

// Logout
logoutBtn.addEventListener("click", () => {
  const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?")
  if (confirmLogout) {
    window.location.href = "index.html"
  }
})

// Initialize
loadSavedGestures()
sortByDate.classList.add("bg-primary", "text-white")
sortByDate.classList.remove("hover:bg-gray-50")
