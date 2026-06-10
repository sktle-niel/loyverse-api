import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { ItemPrice, ItemPricesResponse, PricingProgress, StoreInfo } from '../api/types'

const CACHE_KEY = 'twz.priceList.v1'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour — data persists across visits, then must reload
const POLL_INTERVAL_MS = 1200

interface CachedPrices {
  items: ItemPrice[]
  stores: StoreInfo[]
  source: 'loyverse' | 'mock'
  cachedAt: string
  savedAt: number
}

function readCache(): CachedPrices | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CachedPrices
    if (!c || typeof c.savedAt !== 'number' || !Array.isArray(c.items)) return null
    if (Date.now() - c.savedAt > CACHE_TTL_MS) return null // expired (> 1 hour)
    return c
  } catch {
    return null
  }
}

function writeCache(c: CachedPrices): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c))
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

export function useItemPrices() {
  // Read the persisted cache exactly once. If it's still valid (< 1h) we show it
  // immediately and skip the network entirely.
  const [initial] = useState(() => readCache())

  const [items, setItems] = useState<ItemPrice[]>(initial?.items ?? [])
  const [stores, setStores] = useState<StoreInfo[]>(initial?.stores ?? [])
  const [source, setSource] = useState<'loyverse' | 'mock'>(initial?.source ?? 'mock')
  const [cachedAt, setCachedAt] = useState<string | undefined>(initial?.cachedAt)
  const [savedAt, setSavedAt] = useState<number | null>(initial?.savedAt ?? null)
  const [isLoading, setIsLoading] = useState(!initial)
  const [progress, setProgress] = useState<PricingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const clearPoll = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current)
      pollRef.current = null
    }
  }

  const load = useCallback(async (refresh: boolean) => {
    setError(null)
    setIsLoading(true)
    try {
      const path = refresh ? '/item-prices?refresh=1' : '/item-prices'
      const res = await apiFetchJson<ItemPricesResponse>(path, { timeoutMs: 120_000 })
      if (!isMountedRef.current) return

      setStores(res.stores)
      setSource(res.source)
      setCachedAt(res.cachedAt)
      if (res.items.length > 0) setItems(res.items) // fill in as partial results grow

      if (res.isLoading) {
        // Still building on the server — show progress and poll again shortly.
        setProgress(res.progress ?? null)
        clearPoll()
        pollRef.current = setTimeout(() => { void load(false) }, POLL_INTERVAL_MS)
      } else {
        // Done — finalize and persist for the next hour.
        setItems(res.items)
        setProgress(null)
        setIsLoading(false)
        const saved = Date.now()
        setSavedAt(saved)
        writeCache({
          items: res.items,
          stores: res.stores,
          source: res.source,
          cachedAt: res.cachedAt,
          savedAt: saved,
        })
      }
    } catch (e) {
      if (!isMountedRef.current) return
      const msg = e instanceof Error ? e.message : 'Failed to fetch item prices'
      setError(
        msg.includes('timed out')
          ? 'Server is starting up — the price list may take a minute. Please wait or refresh.'
          : msg,
      )
      setProgress(null)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    if (!initial) {
      void load(false) // no valid cache → load fresh (with progress)
    }
    return () => {
      isMountedRef.current = false
      clearPoll()
    }
  }, [initial, load])

  const refresh = useCallback(() => {
    clearPoll()
    void load(true)
  }, [load])

  return { items, stores, source, cachedAt, savedAt, isLoading, progress, error, refresh }
}
