import type { User } from '@/types'

const USER_KEY = 'pa_user'
const SESSION_COOKIE = 'pa_session'

// Access token vive solo en memoria — nunca en localStorage ni en cookies accesibles por JS.
// Se pierde al recargar la página; api.ts lo refresca automáticamente via /auth/refresh.
let accessToken: string | null = null

// Cache para getUser(): evita crear un objeto nuevo en cada llamada a getSnapshot
// de useSyncExternalStore, lo que causaría un loop infinito de re-renders.
let _cachedRaw: string | null | undefined = undefined
let _cachedUser: User | null = null

export function saveSession(token: string, user: User): void {
  accessToken = token
  if (typeof window === 'undefined') return
  const serialized = JSON.stringify(user)
  _cachedRaw = serialized
  _cachedUser = user
  localStorage.setItem(USER_KEY, serialized)
  // Indicador no sensible para que el middleware de Next.js sepa que hay sesión.
  // La seguridad real la provee la httpOnly cookie `refresh_token` del backend.
  // SameSite=Lax (no Strict) para que el cookie sobreviva el redirect cross-site
  // del callback OAuth de MP (onrender.com → pay-alert.com.ar).
  document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Lax${
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
  if (raw === _cachedRaw) return _cachedUser
  _cachedRaw = raw
  try {
    _cachedUser = raw ? (JSON.parse(raw) as User) : null
  } catch {
    _cachedUser = null
  }
  return _cachedUser
}

export function updateUser(patch: Partial<User>): void {
  if (typeof window === 'undefined') return
  const current = getUser()
  if (!current) return
  const updated = { ...current, ...patch }
  const serialized = JSON.stringify(updated)
  _cachedRaw = serialized
  _cachedUser = updated
  localStorage.setItem(USER_KEY, serialized)
  // storage event solo se dispara entre tabs; despacharlo manualmente para el mismo tab
  window.dispatchEvent(new StorageEvent('storage', { key: USER_KEY, newValue: serialized }))
}

export function clearSession(): void {
  accessToken = null
  _cachedRaw = null
  _cachedUser = null
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function isAuthenticated(): boolean {
  return accessToken !== null
}
