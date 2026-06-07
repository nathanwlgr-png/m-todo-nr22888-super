// Service Worker para suporte offline PWA
// NR22888 Seamaty Brasil

const CACHE_NAME = 'nr22888-v1';
const OFFLINE_FALLBACK = '/offline.html';

const CRITICAL_ROUTES = [
  '/',
  '/Clients',
  '/ClientProfile',
  '/ModoCacaComercial',
  '/AgendaMensal',
  '/RelatorioRicardo',
  '/GenerateWhatsAppIntegrated',
  '/WhatsAppHub',
];

// Instalação
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto');
      return cache.addAll(CRITICAL_ROUTES.map(r => r + '?v=' + CACHE_NAME));
    }).catch((err) => {
      console.warn('[SW] Erro ao cachear rotas críticas:', err);
    })
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

// Fetch - cache first, fallback network, com offline fallback
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // API calls: network first com timeout
  if (url.pathname.includes('/api') || request.method === 'POST') {
    e.respondWith(
      Promise.race([
        fetch(request).catch(() => new Response('offline')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]).catch(() => {
        if (request.method === 'GET') {
          return caches.match(request) || new Response('offline', { status: 503 });
        }
        return new Response('offline', { status: 503 });
      })
    );
    return;
  }

  // HTML: network first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, res.clone()));
            return res;
          }
          return caches.match(request) || res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets: cache first
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
