importScripts("./js/appshell.js");

const VERSION = 'v0.1.0';
const CACHE_NAME = `realgest-cache-${VERSION}`;
const APP_SHELL = [...self.APP_SHELL_HOME, ...self.APP_SHELL_DASHBOARD];


// Instalar y guardar los archivos del App Shell
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");
  let cacheUrls = async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(APP_SHELL);
    } catch (err) {
      console.error("Error al cachear:", err);
    }
  }

  event.waitUntil(cacheUrls());
});

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
        //console.log("[Service Worker] Sirviendo desde caché:", response);
        return response || fetch(event.request);
      
 
      
    }) 
  );
});
     