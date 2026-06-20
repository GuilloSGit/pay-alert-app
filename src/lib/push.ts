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

// Clave VAPID de Firebase — para getToken() en Chrome/Firefox/Edge
const FCM_VAPID_KEY = 'BJvpLdPRrCT8wz1M2X-JHBb0FSe4vl4OwV-fBBV-KWc-KJ6ovGZo3LHSG8FqN-WpOOSGOH1xEmjX2SaYfDyXAgo'

// Clave VAPID propia — para PushManager.subscribe() en Safari
const WEB_PUSH_VAPID_PUBLIC_KEY = 'BNtclkmNlurhzIBMesLcMspELLi3zzwDjyEwz0eqdMk3Ms2aif3_ZqF9khgDMl4xVzjDRUoJKch5nSch90OopDc'

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

// Safari (macOS y iOS) no soporta el SDK de Firebase Messaging.
// Detectamos por la ausencia de Chrome/Firefox/Edge en el UA.
function isSafari(): boolean {
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|OPR|Edg|SamsungBrowser/i.test(ua)
}

// Convierte una VAPID public key en base64url al Uint8Array que espera PushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

function getDeviceName(): string {
  const ua = navigator.userAgent
  let browser = 'Navegador'
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
  else if (ua.includes('SamsungBrowser/')) browser = 'Samsung'
  else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Chrome'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  let os = 'Web'
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Windows NT/.test(ua)) os = 'Windows'
  else if (/Linux/.test(ua)) os = 'Linux'
  return `${browser} en ${os}`
}

export async function registerPushIfPermitted(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return
  if (Notification.permission === 'denied') return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const deviceName = getDeviceName()
    const fingerprint = getFingerprint()

    if (isSafari()) {
      // Safari: Web Push nativo con VAPID propio
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_VAPID_PUBLIC_KEY),
      })
      const key = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      if (!key || !auth) return

      await api.post('/api/v1/users/me/devices', {
        webPushSubscription: {
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
        platform: 'web',
        deviceName,
        fingerprint,
      })
    } else {
      // Chrome / Firefox / Edge: FCM con getToken()
      const messaging = getMessaging(getFirebaseApp())
      const fcmToken = await getToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg })
      if (!fcmToken) return

      await api.post('/api/v1/users/me/devices', {
        fcmToken,
        platform: 'web',
        deviceName,
        fingerprint,
      })
    }
  } catch {
    // Silencioso: permiso denegado, navegador sin soporte, o error de red
  }
}
