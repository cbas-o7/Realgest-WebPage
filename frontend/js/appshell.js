// Recursos esenciales para la página principal (Home/Login)
const APP_SHELL_HOME = [
  "./",
  "./index.html",
  "./js/script.js",
  "./api/auth.service.js",
  "./static/realgest.png", // logo
  "./js/tailwind.js",   // tailwind CSS
  "manifest.json",
  "./js/appshell.js"
];

// Recursos para el Dashboard
const APP_SHELL_DASHBOARD = [
  "./html/dashboard.html",
  "./js/dashboard.js",
];

// Exportar para que el service worker lo importe
self.APP_SHELL_HOME = APP_SHELL_HOME;
self.APP_SHELL_DASHBOARD = APP_SHELL_DASHBOARD;