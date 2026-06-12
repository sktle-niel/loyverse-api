import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type {
  CreatedItemRecord,
  CreatedItemsResponse,
  DeletedItemRecord,
  DeletedItemsResponse,
  PriceHistoryEntry,
  PriceHistoryResponse,
} from '../api/types'

/** Loads price-change history plus the created- and deleted-item logs for the Catalog History page. */
export function useCatalogHistory() {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([])
  const [createdItems, setCreatedItems] = useState<CreatedItemRecord[]>([])
  const [deletedItems, setDeletedItems] = useState<DeletedItemRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ph, ci, di] = await Promise.all([
        apiFetchJson<PriceHistoryResponse>('/price-history'),
        apiFetchJson<CreatedItemsResponse>('/items/created'),
        apiFetchJson<DeletedItemsResponse>('/items/deleted'),
      ])
      setPriceHistory(ph.history)
      setCreatedItems(ci.items)
      setDeletedItems(di.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return { priceHistory, createdItems, deletedItems, isLoading, error, refetch: fetchAll }
}
