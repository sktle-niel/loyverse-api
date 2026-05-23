export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function readLocalStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  return safeJsonParse<T>(window.localStorage.getItem(key))
}

export function writeLocalStorageJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

