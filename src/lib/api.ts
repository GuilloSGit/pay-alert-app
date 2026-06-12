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

async function tryRefresh(): Promise<boolean> {
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

  if (res.status === 401) {
    clearSession()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiError(401, 'UNAUTHORIZED', 'Sesión expirada')
  }

  const body = await res.json().catch(() => ({}))

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
