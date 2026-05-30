import {
  clearAuthSession,
  getStoredRefreshToken,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from '../utils/authStorage'

export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api'
  }

  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    let base = fromEnv.trim().replace(/\/$/, '')
    if (!base.endsWith('/api')) {
      base = `${base}/api`
    }
    return base
  }

  return '/api'
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const DEFAULT_TIMEOUT_MS = 15000

function buildTimeoutMessage(): string {
  return 'Request timed out. The server may be starting up — this can take up to a minute. Please wait and try again.'
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController()
  const id = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(id)
  }
}

// Dedup: only one refresh attempt runs at a time across all concurrent requests.
let pendingRefresh: Promise<string | null> | null = null

async function tryRefreshToken(): Promise<string | null> {
  if (pendingRefresh) return pendingRefresh

  pendingRefresh = (async (): Promise<string | null> => {
    const refreshToken = getStoredRefreshToken()
    if (!refreshToken) return null

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { token: string }
      const user = getStoredUser()
      if (user) setAuthSession(data.token, user)
      return data.token
    } catch {
      return null
    }
  })()

  try {
    return await pendingRefresh
  } finally {
    pendingRefresh = null
  }
}

async function executeRequest(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const res = await fetchWithTimeout(url, init, timeoutMs)

  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      return fetchWithTimeout(url, { ...init, headers: buildHeaders() }, timeoutMs)
    }
  }

  return res
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearAuthSession()
    window.dispatchEvent(new Event('auth:session-expired'))
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text || res.statusText
    try {
      const json = JSON.parse(text) as { message?: string; error?: string }
      if (json.message) message = json.message
      else if (json.error) message = json.error
    } catch {
      /* use raw text */
    }
    throw new Error(message || `API request failed (${res.status})`)
  }

  return (await res.json()) as T
}

type RequestOptions = {
  timeoutMs?: number
}

export async function apiFetchJson<T>(path: string, options?: RequestOptions): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let res: Response
  try {
    res = await executeRequest(url, { method: 'GET', headers: buildHeaders() }, timeoutMs)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(buildTimeoutMessage())
    }
    throw e
  }

  return handleResponse<T>(res)
}

export async function apiPatchJson<T>(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let res: Response
  try {
    res = await executeRequest(
      url,
      { method: 'PATCH', headers: buildHeaders(), body: JSON.stringify(body) },
      timeoutMs,
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(buildTimeoutMessage())
    }
    throw e
  }

  return handleResponse<T>(res)
}

export async function apiPostJson<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let res: Response
  try {
    res = await executeRequest(
      url,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      },
      timeoutMs,
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(buildTimeoutMessage())
    }
    throw e
  }

  return handleResponse<T>(res)
}
