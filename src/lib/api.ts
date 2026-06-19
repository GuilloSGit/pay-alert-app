import { getAccessToken, setAccessToken, clearSession } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type FetchOptions = RequestInit & {
  skipAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // manda la httpOnly cookie refresh_token al backend
    })
    if (!res.ok) return false
    const body = (await res.json()) as { data: { accessToken: string } }
    setAccessToken(body.data.accessToken)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options: FetchOptions = {}, isRetry = false): Promise<T> {
  const { skipAuth, ...fetchOptions } = options

  const method = (fetchOptions.method ?? 'GET').toUpperCase()
  const hasBody = method !== 'GET' && method !== 'DELETE' && method !== 'HEAD'

  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (!skipAuth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && !skipAuth && !isRetry) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(path, options, true)
    clearSession()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiError(401, 'UNAUTHORIZED', 'Sesión expirada')
  }

  // isRetry=true: el refresh funcionó pero el retry también da 401 → cerrar sesión.
  // skipAuth=true (ej: login): no redirigir — el caller maneja el error.
  if (res.status === 401 && !skipAuth) {
    clearSession()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiError(401, 'UNAUTHORIZED', 'Sesión expirada')
  }

  const body = await res.json().catch(() => ({}))

  if (res.status === 402 && !skipAuth) {
    if ((body as { code?: string }).code === 'SUBSCRIPTION_INACTIVE' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscription:inactive'))
    }
    throw new ApiError(402, (body as { code?: string }).code ?? 'SUBSCRIPTION_INACTIVE', (body as { error?: string }).error ?? 'Suscripción inactiva')
  }

  if (res.ok) {
    const warning = res.headers.get('X-Subscription-Warning')
    if (warning && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscription:warning', { detail: warning }))
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, body.code ?? 'UNKNOWN_ERROR', body.error ?? 'Error desconocido', body.data)
  }

  return body as T
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  put: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string, options?: FetchOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
