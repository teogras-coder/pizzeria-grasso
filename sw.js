// =====================================================
// 🍕 SERVICE WORKER - Antica Pizzeria Grasso
// Versione: 5.0 - CACHE + NOTIFICHE ADMIN
// =====================================================

// 🔥 Cambia questa versione ogni volta che fai aggiornamenti grafici o di codice
const STATIC_CACHE = 'pizzeria-grasso-static-v25';
const DYNAMIC_CACHE = 'pizzeria-grasso-dynamic-v25';

// Risorse statiche salvate al primo avvio
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest-clienti.json',
  '/icon-clienti-192.png',
  '/icon-clienti-512.png',
  '/icon-admin-192.png'
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 INSTALL: Scarica e memorizza le risorse statiche
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Inizializzazione cache statica...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Errore durante l\'installazione:', err))
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 ACTIVATE: Rimuove le vecchie versioni della cache
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Rimozione vecchia cache:', key);
            return caches.delete(key);
          })
      );
    })
    .then(() => {
      console.log('[SW] Controllo client acquisito');
      return self.clients.claim();
    })
    .then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: STATIC_CACHE
          });
        });
      });
    })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 FETCH: Strategia di rete ibrida
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('fetch', event => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // ─── ESCLUSIONI: Bypass totale per chiamate Realtime / Auth / API ───
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('firebasedatabase.app')) {
    return;
  }
  
  if (url.hostname.includes('identity-toolkit') ||
      url.hostname.includes('securetoken.google.com') ||
      url.hostname.includes('googleapis.com/identitytoolkit')) {
    return;
  }
  
  if (url.hostname.includes('fcm') ||
      url.hostname.includes('firebaseinstallations') ||
      url.hostname.includes('onesignal.com')) {
    return;
  }

  // ─── Cache First per file statici (immagini, font, CSS, JS) ───
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
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseToCache))
                .catch(err => console.warn('[SW] Errore salvataggio risorsa:', err));
              
              return response;
            })
            .catch(() => new Response('', { status: 404, statusText: 'Offline' }));
        })
    );
    return;
  }

  // ─── Network First per file HTML ───
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200 && 
            (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseToCache))
            .catch(err => console.warn('[SW] Errore cache dinamica HTML:', err));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cached => {
            if (cached) return cached;
            
            const accept = request.headers.get('accept') || '';
            if (accept.includes('text/html')) {
              if (url.pathname.includes('admin')) {
                return caches.match('/admin.html');
              }
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 MESSAGE: Ricezione comandi e notifiche Admin
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('message', event => {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data.type === 'CLEAR_CACHE') {
    caches.delete(STATIC_CACHE).then(() => caches.delete(DYNAMIC_CACHE));
  }

  // Notifiche sistema per Admin (a schermo spento / tendina)
  if (data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(
        data.title || '🍕 Nuovo ordine!',
        {
          body: data.body || '',
          icon: data.icon || '/icon-admin-192.png',
          badge: data.badge || '/icon-admin-192.png',
          tag: data.tag || 'grasso-order-' + Date.now(),
          renotify: true,
          requireInteraction: true,
          vibrate: [300, 150, 300, 150, 300],
          data: { url: data.url || '/admin.html' }
        }
      )
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👆 NOTIFICATION CLICK: Focalizza o apre l'app Admin
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/admin.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      for (const client of clientsArr) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

console.log('🚀 SW avviato! Versione:', STATIC_CACHE);