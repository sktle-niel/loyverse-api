import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetchJson, apiPostJson } from '../api/client'
import type { StockLevelProduct, StockLevelsResponse, StoreInfo, SyncProgress } from '../api/types'

const BACKGROUND_POLL_MS = 5_000
const AUTO_REFRESH_MS    = 45 * 1000 // 45 sec — just over the 30-sec server TTL so the frontend stays in sync
const PAUSED_STORAGE_KEY    = 'sktle_stocks_paused'
const RESETTING_STORAGE_KEY = 'sktle_stocks_resetting'

function getPersistedPaused(): boolean {
  try { return sessionStorage.getItem(PAUSED_STORAGE_KEY) === '1' } catch { return false }
}

function setPersistedPaused(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(PAUSED_STORAGE_KEY, '1')
    else sessionStorage.removeItem(PAUSED_STORAGE_KEY)
  } catch { /* ok — sessionStorage might not be available */ }
}

function getPersistedResetting(): boolean {
  try { return sessionStorage.getItem(RESETTING_STORAGE_KEY) === '1' } catch { return false }
}

function setPersistedResetting(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(RESETTING_STORAGE_KEY, '1')
    else sessionStorage.removeItem(RESETTING_STORAGE_KEY)
  } catch { /* ok */ }
}

// Module-level — survives component unmount/remount (navigation)
let _paused = getPersistedPaused()

export function useStockLevels() {
  const [products, setProducts] = useState<StockLevelProduct[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [cachedAt, setCachedAt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(getPersistedResetting)
  const [isServerLoading, setIsServerLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isPaused, setIsPaused] = useState(_paused) // init from persisted state
  const [error, setError] = useState<string | null>(null)

  const serverPollRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFetchingRef  = useRef(false)

  const clearServerPoll = () => {
    if (serverPollRef.current) { clearInterval(serverPollRef.current); serverPollRef.current = null }
  }

  const clearAutoRefresh = () => {
    if (autoRefreshRef.current) { clearInterval(autoRefreshRef.current); autoRefreshRef.current = null }
  }

  const fetchLevels = useCallback(async (refresh = false, silent = false) => {
    if (silent && isFetchingRef.current) return
    isFetchingRef.current = true

    // Capture before async work — true if we're recovering a reset state after reload
    const wasResetting = getPersistedResetting()

    if (!silent) {
      if (refresh) {
        setIsResetting(true)
        setPersistedResetting(true) // persist so page reload shows "Resetting…"
      } else {
        setIsLoading(true)
      }
    }
    setError(null)

    try {
      const path = refresh ? '/stocks?refresh=1' : '/stocks'
      const res = await apiFetchJson<StockLevelsResponse>(path, { timeoutMs: 60_000 })

      setProducts(res.products)
      setStores(res.stores)
      setSource(res.source)
      setCachedAt(res.cachedAt)
      setIsServerLoading(res.isLoadingInBackground ?? false)
      setSyncProgress(res.syncProgress ?? null)

      // Keep isResetting alive while the server is still doing the full sync triggered by
      // reset. Clears automatically as soon as the background sync finishes.
      // This also handles the page-reload case (wasResetting = true from sessionStorage).
      if (refresh || wasResetting) {
        if (res.isLoadingInBackground) {
          setPersistedResetting(true)
          setIsResetting(true)
        } else {
          setPersistedResetting(false)
          setIsResetting(false)
        }
      }

      if (res.isLoadingInBackground && !_paused) {
        clearServerPoll()
        serverPollRef.current = setInterval(() => {
          void fetchLevels(false, true)
        }, BACKGROUND_POLL_MS)
      } else {
        clearServerPoll()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch stock levels'
      setError(msg.includes('timed out')
        ? 'Server is still loading stock data. Please wait and try again.'
        : msg)
      // Clear resetting on error so the UI doesn't get stuck
      if (refresh || wasResetting) {
        setPersistedResetting(false)
        setIsResetting(false)
      }
    } finally {
      isFetchingRef.current = false
      if (!silent) {
        setIsLoading(false)
        // Do NOT clear isResetting here for reset-triggered fetches — it's managed by
        // the response handler above based on whether the server is still loading.
        if (!refresh && !wasResetting) {
          setIsResetting(false)
        }
      }
    }
  }, [])

  const startAutoRefresh = useCallback(() => {
    clearAutoRefresh()
    autoRefreshRef.current = setInterval(() => {
      // Skip if a background-poll interval is already fetching every 5s during a sync.
      // This prevents double-polling while the server is doing a full sync.
      if (!_paused && !serverPollRef.current) void fetchLevels(false, true)
    }, AUTO_REFRESH_MS)
  }, [fetchLevels])

  const pause = useCallback(() => {
    _paused = true
    setPersistedPaused(true)
    setIsPaused(true)
    // Stopping also ends any active "resetting" state
    setPersistedResetting(false)
    setIsResetting(false)
    clearServerPoll()
    clearAutoRefresh()
    // Tell the backend to stop the in-progress sync at the next page boundary
    void apiPostJson('/stocks/stop').catch(() => { /* fire-and-forget */ })
  }, [])

  const resume = useCallback(() => {
    _paused = false
    setPersistedPaused(false)
    setIsPaused(false)
    startAutoRefresh()
    // Tell the backend to resume (continues from saved cursor if available), then poll
    void apiPostJson('/stocks/resume')
      .then(() => { void fetchLevels(false, true) })
      .catch(() => { void fetchLevels(false, true) })
  }, [fetchLevels, startAutoRefresh])

  const reset = useCallback(() => {
    _paused = false
    setPersistedPaused(false)
    setIsPaused(false)
    setIsServerLoading(true) // show progress bar immediately, before API response
    setSyncProgress(null)    // clear any stale progress from a previous sync
    clearServerPoll()
    clearAutoRefresh()
    void fetchLevels(true)
    startAutoRefresh()
  }, [fetchLevels, startAutoRefresh])

  useEffect(() => {
    if (_paused) {
      // When paused, just show cached data without triggering a sync
      void fetchLevels(false)
    } else {
      // Always trigger a full sync on mount so the page loads the latest data immediately
      setIsServerLoading(true)
      setSyncProgress(null)
      void fetchLevels(true)
      startAutoRefresh()
    }
    return () => {
      clearServerPoll()
      clearAutoRefresh()
    }
  }, [fetchLevels, startAutoRefresh])

  return {
    products,
    stores,
    source,
    cachedAt,
    isLoading,
    isResetting,
    isServerLoading,
    syncProgress,
    isPaused,
    error,
    pause,
    resume,
    reset,
  }
}
