const CACHE_VERSION = 'seamty-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        console.log('Offline mode: alguns assets não foram cacheados');
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_VERSION)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // GET requests: try network first, fallback to cache
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(response => {
            return response || new Response('Offline - dados não disponíveis', { status: 503 });
          });
        })
    );
  } else {
    // POST/PUT/DELETE: queue for sync
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request.clone());
        } catch {
          // Queue for later sync
          if (event.request.method !== 'GET') {
            const db = await indexedDB.open('SeamtyOfflineDB', 1);
            const tx = db.transaction('SyncQueue', 'readwrite');
            await tx.objectStore('SyncQueue').add({
              method: event.request.method,
              url: event.request.url,
              body: await event.request.text(),
              timestamp: new Date().toISOString()
            });
          }
          return new Response('Operação enfileirada para sincronização', { status: 202 });
        }
      })()
    );
  }
});
