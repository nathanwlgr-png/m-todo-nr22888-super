const CACHE_NAME = 'seamaty-nr22-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache opened');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log('Service Worker: Some assets failed to cache', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls from fetch (let them fail gracefully in app)
  if (event.request.url.includes('/api/') || event.request.url.includes('.base44.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Network first for HTML, JS, CSS
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - Resource not cached', { status: 503 });
        });
      })
  );
});

// Background sync placeholder
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        try {
          const response = await fetch('/api/sync');
          if (response.ok) {
            console.log('Service Worker: Sync successful');
          }
        } catch (error) {
          console.log('Service Worker: Sync failed, will retry');
        }
      })()
    );
  }
});

// Push notification placeholder
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Seamaty Notification';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'seamaty-notification',
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
