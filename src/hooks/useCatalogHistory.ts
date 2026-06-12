import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type {
  CreatedItemRecord,
  CreatedItemsResponse,
  PriceHistoryEntry,
  PriceHistoryResponse,
} from '../api/types'

/** Loads both price-change history and the created-items log for the Catalog History page. */
export function useCatalogHistory() {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([])
  const [createdItems, setCreatedItems] = useState<CreatedItemRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ph, ci] = await Promise.all([
        apiFetchJson<PriceHistoryResponse>('/price-history'),
        apiFetchJson<CreatedItemsResponse>('/items/created'),
      ])
      setPriceHistory(ph.history)
      setCreatedItems(ci.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return { priceHistory, createdItems, isLoading, error, refetch: fetchAll }
}
