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

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Pay Alert', {
    body,
    icon: '/favicon.ico',
  });
});
