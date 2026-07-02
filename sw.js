// =====================================================
// 🍕 SERVICE WORKER - Antica Pizzeria Grasso
// Versione: 3.0 (2026-07-02)
// =====================================================

const STATIC_CACHE = 'pizzeria-grasso-static-v3';
const DYNAMIC_CACHE = 'pizzeria-grasso-dynamic-v3';

// Risorse statiche da cacheare all'installazione
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 INSTALL: Cachea risorse statiche
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache statiche inizializzata');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Errore install:', err))
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 ACTIVATE: Pulisce vecchie cache
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Elimino vecchia cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 FETCH: Strategia ibrida
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Ignora richieste non GET
  if (request.method !== 'GET') return;
  
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return; // URL non valido, ignora
  }

  // ─── ESCLUSIONI: NON cachare mai ───
  // 1. API Firebase Realtime DB (dati sempre freschi via listener)
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('firebasedatabase.app')) {
    return;
  }
  
  // 2. Firebase Auth / Identity Toolkit
  if (url.hostname.includes('identity-toolkit') ||
      url.hostname.includes('securetoken.google.com') ||
      url.hostname.includes('googleapis.com/identitytoolkit')) {
    return;
  }
  
  // 3. FCM / Messaging
  if (url.hostname.includes('fcm') ||
      url.hostname.includes('firebaseinstallations')) {
    return;
  }

  // ─── STRATEGIA 1: Cache First per risorse statiche ───
  if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;
          
          return fetch(request)
            .then(response => {
              // Cachea solo risposte valide
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(request, responseToCache))
                .catch(err => console.warn('[SW] Errore cache statica:', err));
              
              return response;
            })
            .catch(() => {
              // Fallback offline per immagini
              if (/\.(png|jpg|jpeg|gif|svg|webp)$/.test(url.pathname)) {
                return new Response('', { status: 404, statusText: 'Offline' });
              }
            });
        })
    );
    return;
  }

  // ─── STRATEGIA 2: Network First per HTML e altro ───
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cachea solo risposte HTML valide
        if (response && response.status === 200 && 
            (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseToCache))
            .catch(err => console.warn('[SW] Errore cache dinamica:', err));
        }
        return response;
      })
      .catch(() => {
        // Fallback offline
        return caches.match(request)
          .then(cached => {
            if (cached) return cached;
            
            // Se è una richiesta HTML, servi la index
            const accept = request.headers.get('accept') || '';
            if (accept.includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 MESSAGE: Aggiornamento forzato da admin
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING ricevuto, aggiorno subito');
    self.skipWaiting();
  }
  
  // Supporto per pulizia cache manuale
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(STATIC_CACHE).then(() => caches.delete(DYNAMIC_CACHE));
  }
});
