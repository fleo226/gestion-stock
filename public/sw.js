const CACHE_NAME = 'ma-boutique-v1';
const API_CACHE_NAME = 'ma-boutique-api-v1';
const STATIC_CACHE_NAME = 'ma-boutique-static-v1';

// URLs à mettre en cache
const STATIC_URLS = [
  '/',
  '/manifest.json',
  '/offline',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const API_URLS = [
  '/api/articles',
  '/api/mouvements',
  '/api/sync'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  
  event.waitUntil(
    Promise.all([
      // Cache des ressources statiques
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_URLS);
      }),
      
      // Cache des API
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.addAll(API_URLS);
      })
    ])
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Suppression du cache ancien:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de cache: Cache First pour les statiques, Network First pour les API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ne pas gérer les chrome:// URLs
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Gérer les requêtes API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mettre en cache la réponse si elle est OK
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si échec, retourner depuis le cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Gérer les requêtes statiques
  if (url.pathname.startsWith('/icons/') || 
      url.pathname === '/manifest.json' || 
      url.pathname === '/favicon.ico') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          return caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }
  
  // Gérer les requêtes HTML
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si hors ligne, retourner la page offline
          return caches.match('/offline');
        })
    );
    return;
  }
  
  // Stratégie Cache First pour les autres ressources
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// Gestion des messages du service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Ma Boutique', options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view-stock') {
    event.waitUntil(
      clients.openWindow('/stock')
    );
  } else if (event.action === 'view-activity') {
    event.waitUntil(
      clients.openWindow('/activite')
    );
  } else {
    // Par défaut, ouvrir l'application
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Synchroniser les données hors-ligne
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      })
    );
  }
});

// Gestion de la mise à jour du service worker
self.addEventListener('controllerchange', () => {
  console.log('Service Worker: Contrôleur changé');
  
  // Envoyer un message à tous les clients pour forcer le rechargement
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE'
      });
    });
  });
});