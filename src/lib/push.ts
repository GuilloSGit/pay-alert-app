import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { api } from './api'

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCnWfg9Hpl8YPplqoTZcnQ3nSQ_zrHqNgE',
  authDomain: 'pay-alert-89017.firebaseapp.com',
  projectId: 'pay-alert-89017',
  storageBucket: 'pay-alert-89017.firebasestorage.app',
  messagingSenderId: '654503153960',
  appId: '1:654503153960:web:bd909e44f0e6525b42c01d',
}

const VAPID_KEY = 'BJvpLdPRrCT8wz1M2X-JHBb0FSe4vl4OwV-fBBV-KWc-KJ6ovGZo3LHSG8FqN-WpOOSGOH1xEmjX2SaYfDyXAgo'

function getFingerprint(): string {
  const parts = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ]
  return btoa(parts.join('|'))
}

function getFirebaseApp() {
  return getApps().length ? getApps()[0]! : initializeApp(FIREBASE_CONFIG)
}

export async function registerPushIfPermitted(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return
  if (Notification.permission === 'denied') return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const messaging = getMessaging(getFirebaseApp())
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg })
    if (!fcmToken) return

    const deviceName = navigator.userAgent.includes('Mobile') ? 'Móvil Web' : 'Escritorio Web'

    await api.post('/api/v1/users/me/devices', {
      fcmToken,
      platform: 'web',
      deviceName,
      fingerprint: getFingerprint(),
    })
  } catch {
    // Silencioso: permiso denegado, navegador sin soporte, o error de red
  }
}
