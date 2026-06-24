const CACHE_NAME = 'pizzeria-grasso-v3'; // 🔥 AGGIORNATO A V3
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';

// Risorse essenziali da precaricare
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest-clienti.json',
  '/manifest.json',
  '/offline.html'
];

// Installazione: Cachea le risorse statiche
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('Cache statiche installate');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Attivazione: Pulisce vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategia mista
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Risorse statiche (CDN, fonts, immagini): Cache First
  if (request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
  } 
  // HTML e API: Network First con fallback
  else {
    event.respondWith(
      fetch(request).then(response => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});

// Gestione skip waiting manuale
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
