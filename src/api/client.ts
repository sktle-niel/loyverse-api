import { clearAuthSession, getStoredToken } from '../utils/authStorage'

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

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearAuthSession()
    window.dispatchEvent(new Event('auth:session-expired'))
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text || res.statusText
    try {
      const json = JSON.parse(text) as { error?: string }
      if (json.error) message = json.error
    } catch {
      /* use raw text */
    }
    if (res.status === 404) {
      throw new Error(
        'API route not found (404). Deploy the latest backend with auth routes, or check VITE_API_BASE_URL ends with /api.',
      )
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

  let res: Response
  try {
    res = await fetchWithTimeout(
      url,
      { method: 'GET', headers: buildHeaders() },
      options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out. Is the backend running on localhost:3001?')
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

  let res: Response
  try {
    res = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out. Is the backend running on localhost:3001?')
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

  let res: Response
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out. Is the backend running on localhost:3001?')
    }
    throw e
  }

  return handleResponse<T>(res)
}
