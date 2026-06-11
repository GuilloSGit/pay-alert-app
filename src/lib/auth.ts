import type { User } from '@/types'

const USER_KEY = 'pa_user'
const SESSION_COOKIE = 'pa_session'

// Access token vive solo en memoria — nunca en localStorage ni en cookies accesibles por JS.
// Se pierde al recargar la página; api.ts lo refresca automáticamente via /auth/refresh.
let accessToken: string | null = null

export function saveSession(token: string, user: User): void {
  accessToken = token
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Indicador no sensible para que el middleware de Next.js sepa que hay sesión.
  // La seguridad real la provee la httpOnly cookie `refresh_token` del backend.
  document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Strict${
    location.protocol === 'https:' ? '; Secure' : ''
  }`
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string): void {
  accessToken = token
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearSession(): void {
  accessToken = null
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function isAuthenticated(): boolean {
  return accessToken !== null
}
