import type { User } from '@/types'

const TOKEN_KEY = 'pa_access_token'
const USER_KEY = 'pa_user'

export function saveSession(accessToken: string, user: User) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // también en cookie para que el middleware de Next.js lo pueda leer
  document.cookie = `${TOKEN_KEY}=${accessToken}; path=/; SameSite=Strict${location.protocol === 'https:' ? '; Secure' : ''}`
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
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

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
