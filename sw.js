const CACHE_NAME = 'pizzeria-grasso-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

// Risorse statiche da cacheare immediatamente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'  // Pagina offline opzionale
];

// Install: cachea risorse statiche
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Cache statiche');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: pulisce vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => {
              console.log('Elimino vecchia cache:', key);
              return caches.delete(key);
            })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: strategia Cache First per statiche, Network First per dinamiche
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Risorse statiche (CDN, fonts, etc)
  if (request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            // Cache first per risorse statiche
            return cached;
          }
          // Altrimenti fetch e cache
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseToCache));
              return response;
            });
        })
    );
  } 
  // HTML e API - Network first
  else {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache la risposta per il prossimo utilizzo
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => {
          // Fallback alla cache se offline
          return caches.match(request)
            .then(cached => {
              if (cached) return cached;
              // Se è una richiesta HTML, servi la index
              if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
            });
        })
    );
  }
});

// Notifica aggiornamento
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
