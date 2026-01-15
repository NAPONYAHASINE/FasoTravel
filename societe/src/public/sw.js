const CACHE_NAME = 'fasotravel-v1.0.0';
const STATIC_CACHE = 'fasotravel-static-v1';
const DYNAMIC_CACHE = 'fasotravel-dynamic-v1';

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/globals.css',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprimer les anciens caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache : Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ignorer les URLs externes
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cloner la réponse car elle ne peut être consommée qu'une fois
        const responseClone = response.clone();
        
        // Mettre en cache la réponse
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // Si network fail, chercher dans le cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('[SW] Réponse depuis le cache:', request.url);
            return cachedResponse;
          }
          
          // Si pas dans le cache, retourner page offline
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Gestion des messages depuis l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener('controllerchange', () => {
  console.log('[SW] Nouveau service worker actif');
});
