import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { StockLevelProduct, StockLevelsResponse, StoreInfo } from '../api/types'

const BACKGROUND_POLL_MS = 20_000 // poll every 20s while server is loading

export function useStockLevels() {
  const [products, setProducts] = useState<StockLevelProduct[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [cachedAt, setCachedAt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isServerLoading, setIsServerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const fetchLevels = useCallback(async (refresh = false, silent = false) => {
    if (!silent) {
      if (refresh) setIsRefreshing(true)
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

      // If server is still building the cache, keep polling until it's done
      if (res.isLoadingInBackground) {
        clearPoll()
        pollRef.current = setInterval(() => {
          void fetchLevels(false, true)
        }, BACKGROUND_POLL_MS)
      } else {
        clearPoll()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch stock levels'
      setError(msg.includes('timed out')
        ? 'Server is still loading stock data. Please try refreshing in a moment.'
        : msg)
    } finally {
      if (!silent) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchLevels(false)
    return () => clearPoll()
  }, [fetchLevels])

  return {
    products,
    stores,
    source,
    cachedAt,
    isLoading,
    isRefreshing,
    isServerLoading,
    error,
    refresh: () => fetchLevels(true),
  }
}
