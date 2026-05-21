export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base || typeof base !== 'string') {
    // Let the app still load; fetch will fail and we can show an error.
    return ''
  }
  return base.replace(/\/$/, '')
}

export async function apiFetchJson<T>(path: string): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API request failed (${res.status}): ${text || res.statusText}`)
  }

  return (await res.json()) as T
}

