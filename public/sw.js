/*
  FIREBASE MESSAGING SERVICE WORKER
  ---------------------------------
  1. Add your Firebase Config below manually (env vars don't work in SW)
  2. This handles background notifications
*/
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

try {
  firebase.initializeApp({
    // REPLACE WITH YOUR FIREBASE CONFIG
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'JourniQ Update';
    const notificationOptions = {
      body: payload.notification?.body || 'Check your journal!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase messaging failed to init in SW (expected if config missing):', e);
}

// Handle Notification Click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus if already open
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // Check if the client is focusing on the app
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open if not
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

const CACHE_NAME = 'journiq-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Network-First strategy for HTML/Navigation requests
  // This ensures the user always gets the latest index.html (with new JS hashes)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-First strategy for static assets (images, css, js)
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});