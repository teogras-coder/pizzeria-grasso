const CACHE_NAME = 'pizzeria-grasso-v4'; 
const STATIC_CACHE = 'static-v4';
const DYNAMIC_CACHE = 'dynamic-v4';

// Risorse essenziali da precaricare
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest-clienti.json',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('Cache v4 installata');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // ✅ Se c'è ?v= bypassa TUTTA la cache
  if (url.searchParams.has('v')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Risorse statiche (CSS, JS, Immagini, Font) -> Cache First
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
  // HTML e API (Network First)
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
