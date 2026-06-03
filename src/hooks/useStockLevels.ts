import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { StockLevelProduct, StockLevelsResponse, StoreInfo, SyncProgress } from '../api/types'

const BACKGROUND_POLL_MS = 5_000
const AUTO_REFRESH_MS    = 3 * 60 * 60 * 1000 // 3 hours

export function useStockLevels() {
  const [products, setProducts] = useState<StockLevelProduct[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [cachedAt, setCachedAt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [isServerLoading, setIsServerLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serverPollRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFetchingRef  = useRef(false)
  const isPausedRef    = useRef(false)

  const clearServerPoll = () => {
    if (serverPollRef.current) { clearInterval(serverPollRef.current); serverPollRef.current = null }
  }

  const clearAutoRefresh = () => {
    if (autoRefreshRef.current) { clearInterval(autoRefreshRef.current); autoRefreshRef.current = null }
  }

  const startAutoRefresh = useCallback(() => {
    clearAutoRefresh()
    autoRefreshRef.current = setInterval(() => {
      if (!isPausedRef.current) void fetchLevels(false, true)
    }, AUTO_REFRESH_MS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLevels = useCallback(async (refresh = false, silent = false) => {
    if (silent && isFetchingRef.current) return
    isFetchingRef.current = true

    if (!silent) {
      if (refresh) setIsResetting(true)
      else setIsLoading(true)
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

      if (res.isLoadingInBackground && !isPausedRef.current) {
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
    } finally {
      isFetchingRef.current = false
      if (!silent) {
        setIsLoading(false)
        setIsResetting(false)
      }
    }
  }, [])

  const pause = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
    clearServerPoll()
    clearAutoRefresh()
  }, [])

  const resume = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
    startAutoRefresh()
    void fetchLevels(false, true)
  }, [fetchLevels, startAutoRefresh])

  const reset = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
    clearServerPoll()
    clearAutoRefresh()
    void fetchLevels(true)
    startAutoRefresh()
  }, [fetchLevels, startAutoRefresh])

  useEffect(() => {
    void fetchLevels(false)
    startAutoRefresh()
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
