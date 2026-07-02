// =====================================================
// 🔔 FIREBASE MESSAGING SERVICE WORKER
// Antica Pizzeria Grasso - v2.0 (2026-07-02)
// =====================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 INIZIALIZZAZIONE FIREBASE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
firebase.initializeApp({
  apiKey: "AIzaSyAw8pBS3gOpitVIArnWutBnwca3hXSWuVs",
  authDomain: "teogra-c8cf5.firebaseapp.com",
  databaseURL: "https://teogra-c8cf5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "teogra-c8cf5",
  storageBucket: "teogra-c8cf5.firebasestorage.app",
  messagingSenderId: "686300112893",
  appId: "1:686300112893:web:e147b82f91374f12db1b94"
});

const messaging = firebase.messaging();

// Icona di default per le notifiche
const DEFAULT_ICON = 'https://i.imgur.com/nWLqs68.png';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📨 NOTIFICHE IN BACKGROUND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
messaging.onBackgroundMessage(function(payload) {
  console.log('[FCM-SW] Notifica background ricevuta:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nuova notifica';
  const notificationBody = payload.notification?.body || '';
  const notificationIcon = payload.notification?.icon || DEFAULT_ICON;
  const notificationData = payload.data || {};
  
  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    badge: DEFAULT_ICON,
    tag: notificationData.tag || 'pizzeria-grasso-' + Date.now(),
    renotify: false,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url || '/',
      orderId: notificationData.orderId || null,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '👁️ Apri' },
      { action: 'close', title: '✖️ Chiudi' }
    ]
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👆 CLICK SU NOTIFICA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('notificationclick', function(event) {
  console.log('[FCM-SW] Click su notifica:', event.notification);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  // Chiudi la notifica se l'utente clicca "Chiudi"
  if (event.action === 'close') {
    return;
  }
  
  // Apri o focalizza la finestra dell'app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Se c'è già una finestra aperta, focalizzala
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            // Passa l'URL via postMessage
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              orderId: event.notification.data?.orderId
            });
            return client.focus();
          }
        }
        
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ CHIUSURA NOTIFICA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('notificationclose', function(event) {
  console.log('[FCM-SW] Notifica chiusa dall\'utente');
});

console.log('[FCM-SW] ✅ Service Worker Firebase caricato');
