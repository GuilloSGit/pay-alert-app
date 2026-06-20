// ── Web Push nativo (Safari/iOS) ────────────────────────────────────────────
// Se ejecuta cuando el BE envía vía web-push (payload con from: 'web-push').
// Firebase no maneja estos eventos — los atrapamos aquí antes de que Firebase
// intente inicializarse (que puede fallar en Safari).
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    if (payload.from !== 'web-push') return; // Firebase maneja el resto
    const { title, body, data = {} } = payload;
    event.waitUntil(
      self.registration.showNotification(title ?? 'Pay Alert', {
        body: body ?? 'Nuevo pago recibido',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.paymentId ?? 'pay-alert',
        renotify: true,
        data,
        vibrate: [200, 100, 200],
      })
    );
  } catch {}
});

// ── FCM (Chrome / Firefox / Edge / Android) ─────────────────────────────────
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: 'AIzaSyCnWfg9Hpl8YPplqoTZcnQ3nSQ_zrHqNgE',
    authDomain: 'pay-alert-89017.firebaseapp.com',
    projectId: 'pay-alert-89017',
    storageBucket: 'pay-alert-89017.firebasestorage.app',
    messagingSenderId: '654503153960',
    appId: '1:654503153960:web:bd909e44f0e6525b42c01d',
  });

  const messaging = firebase.messaging();

  // Llamado cuando llega un mensaje FCM y la app está cerrada o en background.
  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {};
    const data = payload.data ?? {};
    self.registration.showNotification(title ?? 'Pay Alert', {
      body: body ?? 'Nuevo pago recibido',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.paymentId ?? 'pay-alert',
      renotify: true,
      data,
      vibrate: [200, 100, 200],
    });
  });
} catch {
  // Firebase no soportado (Safari) — el listener de 'push' de arriba maneja las notificaciones
}

// ── Click en notificación (ambas rutas) ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url) ?? (self.location.origin + '/dashboard/payments');
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
