// =====================================================
// 🍕 SERVICE WORKER - Antica Pizzeria Grasso
// Versione: 4.0 (2026-08-25) - CORRETTO PER GITHUB
// =====================================================

// 🔥 REGOLA: Cambia questi numeri (es. v5, v6) ogni volta che aggiorni l'app!
const STATIC_CACHE = 'pizzeria-grasso-static-v4';
const DYNAMIC_CACHE = 'pizzeria-grasso-dynamic-v4';

// Risorse statiche da cacheare all'installazione
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest-clienti.json',
  '/icon-clienti-192.png',
  '/icon-clienti-512.png'
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
  
  // 3. FCM / Messaging / OneSignal
  if (url.hostname.includes('fcm') ||
      url.hostname.includes('firebaseinstallations') ||
      url.hostname.includes('onesignal.com')) {
    return;
  }

  // ─── STRATEGIA 1: Cache First per risorse statiche (Immagini, CSS, JS esterni) ───
  if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;
          
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE) // Usiamo dynamic per le immagini esterne (es. imgur, firebase storage)
                .then(cache => cache.put(request, responseToCache))
                .catch(err => console.warn('[SW] Errore cache statica:', err));
              
              return response;
            })
            .catch(() => {
              return new Response('', { status: 404, statusText: 'Offline' });
            });
        })
    );
    return;
  }

  // ─── STRATEGIA 2: Network First per HTML (Aggiornamenti immediati) ───
  event.respondWith(
    fetch(request)
      .then(response => {
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
            
            // Se è una richiesta HTML e siamo offline, servi la index dalla cache
            const accept = request.headers.get('accept') || '';
            if (accept.includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 MESSAGE: Aggiornamento forzato
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING ricevuto, aggiorno subito');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(STATIC_CACHE).then(() => caches.delete(DYNAMIC_CACHE));
  }
});