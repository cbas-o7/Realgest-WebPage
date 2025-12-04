/**
 * Verifica si el usuario tiene permiso para acceder a la página actual.
 * @param {string[]} allowedRoles - Array de roles permitidos (ej: ['educador'] o ['usuario', 'educador'])
 */
export function requireAuth(allowedRoles = []) {
  const userJson = localStorage.getItem("user");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // 1. Si no está logueado, mandar al login (index.html)
  if (!isLoggedIn || !userJson) {
    console.warn("Acceso denegado: Usuario no autenticado.");
    // Ajustar la ruta dependiendo de dónde estemos (si estamos en /html/educator/...)
    const pathToIndex = window.location.pathname.includes("/educator/")
      ? "../../index.html"
      : "../index.html";

    window.location.href = pathToIndex;
  }

  const user = JSON.parse(userJson);

  // 2. Si se requieren roles específicos y el usuario no lo tiene
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.warn(`Acceso denegado: El rol '${user.role}' no tiene permiso.`);

    // Redirigir a su dashboard correspondiente
    if (user.role === "educador") {
      window.location.href = "../html/educator/educator.html"; // Ruta relativa asumiendo que intentó entrar a alumno
    } else {
      window.location.href = "../html/dashboard.html"; // Ruta relativa asumiendo que intentó entrar a educador
    }
    return null;
  }

  // 3. Si pasa las verificaciones, devolvemos el usuario
  return user;
}

/**
 * Verifica si ya hay sesión para redirigir desde el Login (index.html)
 */
export function redirectIfLoggedIn() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userJson = localStorage.getItem("user");

  if (isLoggedIn && userJson) {
    const user = JSON.parse(userJson);
    if (user.role === "educador") {
      window.location.href = "html/educator/educator.html";
    } else {
      window.location.href = "html/dashboard.html";
    }
  }
}
