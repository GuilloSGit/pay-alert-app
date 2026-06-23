import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCnWfg9Hpl8YPplqoTZcnQ3nSQ_zrHqNgE',
  authDomain: 'pay-alert-89017.firebaseapp.com',
  projectId: 'pay-alert-89017',
  storageBucket: 'pay-alert-89017.firebasestorage.app',
  messagingSenderId: '654503153960',
  appId: '1:654503153960:web:bd909e44f0e6525b42c01d',
}

const FCM_VAPID_KEY = 'BJvpLdPRrCT8wz1M2X-JHBb0FSe4vl4OwV-fBBV-KWc-KJ6ovGZo3LHSG8FqN-WpOOSGOH1xEmjX2SaYfDyXAgo'
const WEB_PUSH_VAPID_PUBLIC_KEY = 'BNtclkmNlurhzIBMesLcMspELLi3zzwDjyEwz0eqdMk3Ms2aif3_ZqF9khgDMl4xVzjDRUoJKch5nSch90OopDc'

function getFirebaseApp() {
  return getApps().length ? getApps()[0]! : initializeApp(FIREBASE_CONFIG)
}

function isSafari(): boolean {
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|OPR|Edg|SamsungBrowser/i.test(ua)
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

export function getDeviceName(): string {
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

export type PushCredentials =
  | { fcmToken: string; webPushSubscription?: undefined }
  | { webPushSubscription: { endpoint: string; p256dh: string; auth: string }; fcmToken?: undefined }
  | null

// Obtiene las credenciales push del browser sin llamar a la API.
// Pide permiso si aún no fue decidido. Retorna null si no hay push disponible.
export async function tryGetPushCredentials(): Promise<PushCredentials> {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null
  if (Notification.permission === 'denied') return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    if (isSafari()) {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_VAPID_PUBLIC_KEY),
      })
      const key = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      if (!key || !auth) return null

      return {
        webPushSubscription: {
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
      }
    } else {
      const messaging = getMessaging(getFirebaseApp())
      const fcmToken = await getToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg })
      if (!fcmToken) return null
      return { fcmToken }
    }
  } catch {
    return null
  }
}
