importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

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

// Gestione notifiche in background
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notifica in background: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || 'https://i.imgur.com/nWLqs68.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});