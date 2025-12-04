importScripts("./js/appshell.js");

const VERSION = "v0.2.0";
const CACHE_NAME = `realgest-cache-${VERSION}`;
const STATIC_CACHE = `realgest-static-${VERSION}`;
const DYNAMIC_CACHE = `realgest-api-${VERSION}`;

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
  };

  event.waitUntil(cacheUrls());

  // Activar service worker inmediatamente
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );

  // Tomar control inmediato de las páginas abiertas
  self.clients.claim();

  console.log("[Service Worker] Activado y limpiando caches antiguas...");
});

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. ESTRATEGIA PARA API: Network First, falling back to Cache
  // Identificamos las llamadas a tu backend (suponiendo que contienen /api/)
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la respuesta es válida, la clonamos y guardamos en caché dinámico
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red (Offline), buscamos en caché
          console.log("[Service Worker] Offline: Sirviendo API desde caché");
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no hay caché, retornamos un JSON de error o vacío para que la UI no rompa
            return new Response(
              JSON.stringify({ error: "Sin conexión y sin datos cacheados" }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
