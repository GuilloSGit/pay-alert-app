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

// Llamado cuando llega un mensaje y la app está cerrada o en background.
// FCM puede mostrar la notificación nativo (desde el campo notification del payload)
// y también llama a onBackgroundMessage. Mostramos la notificación manualmente
// para poder adjuntarle los datos del pago (necesarios en notificationclick).
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const data = payload.data ?? {};

  self.registration.showNotification(title ?? 'Pay Alert', {
    body: body ?? 'Nuevo pago recibido',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.paymentId ?? 'pay-alert',   // reemplaza notificación anterior del mismo pago
    renotify: true,                        // suena aunque reemplace una existente
    data,                                  // disponible en notificationclick como event.notification.data
    vibrate: [200, 100, 200],
  });
});

// Cuando el usuario hace click en la notificación nativa.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data ?? {};
  // Abrir la página de pagos; si tenemos businessId futuro lo podemos usar
  const url = self.location.origin + '/dashboard/payments';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana de la app abierta, enfocarla
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir una ventana nueva
        return clients.openWindow(url);
      }),
  );
});
