// Service Worker — gestion-stock
// Version à incrémenter à chaque déploiement pour forcer la mise à jour
const CACHE_VERSION = 'v2-' + Date.now();
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// === INSTALLATION ===
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// === ACTIVATION ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// === FETCH ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // RÈGLE 1 : Ne JAMAIS intercepter les requêtes API
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // RÈGLE 2 : Ne JAMAIS intercepter les pages HTML
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // RÈGLE 3 : Assets statiques — réseau d'abord, cache en fallback
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Par défaut : réseau d'abord
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// === MESSAGE ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
