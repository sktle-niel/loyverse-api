import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { ItemPrice, ItemPricesResponse, StoreInfo } from '../api/types'

export function useItemPrices() {
  const [items, setItems] = useState<ItemPrice[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [cachedAt, setCachedAt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const path = refresh ? '/item-prices?refresh=1' : '/item-prices'
      const response = await apiFetchJson<ItemPricesResponse>(path, { timeoutMs: 120_000 })
      setItems(response.items)
      setStores(response.stores)
      setSource(response.source)
      setCachedAt(response.cachedAt)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch item prices'
      if (msg.includes('timed out')) {
        setError('Server is starting up — the price list may take a minute to load. Please wait and refresh.')
      } else {
        setError(msg)
        if (!refresh) setItems([])
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchPrices(false)
  }, [fetchPrices])

  return {
    items,
    stores,
    source,
    cachedAt,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchPrices(true),
  }
}
