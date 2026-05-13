// ── Seamaty NR22888 Service Worker ──────────────────────────────────────────
// CACHE VERSION — bumpe este valor a cada deploy para forçar atualização
const CACHE_VERSION = 'seamaty-v7-' + new Date().toISOString().slice(0, 10);
const STATIC_CACHE  = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

// Assets estáticos para pré-cache
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ── Install: pré-cache assets críticos ──────────────────────────────────────
self.addEventListener('install', event => {
  // Ativa imediatamente sem esperar abas antigas fecharem
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// ── Activate: apaga todos os caches antigos ──────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => {
            console.log('[SW] Deletando cache antigo:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first para navegação, Cache-first para assets ─────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests não-GET e cross-origin fora do escopo
  if (request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('base44')) return;

  // Navegação (HTML) → Network-first com fallback para /index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Armazena cópia fresca no runtime cache
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then(cached => cached || caches.match('/'))
        )
    );
    return;
  }

  // Assets estáticos (JS, CSS, imagens) → Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ico)(\?.*)?$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // API / demais requests → Network-only (sem cache)
  // (deixa passar sem interceptar)
});

// ── Mensagem: forçar atualização a partir da UI ──────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
