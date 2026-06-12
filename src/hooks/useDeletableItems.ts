import { useCallback, useEffect, useState } from 'react'
import { apiDeleteJson, apiFetchJson } from '../api/client'
import type {
  DeletableItemsResponse,
  DeleteItemResponse,
  StockLevelProduct,
  StoreInfo,
} from '../api/types'

/** Loads items that are safe to delete (0 stock in every branch) and deletes them. */
export function useDeletableItems() {
  const [items, setItems] = useState<StockLevelProduct[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetchJson<DeletableItemsResponse>('/items/deletable', { timeoutMs: 60_000 })
      setItems(res.items)
      setStores(res.stores)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load items')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  const deleteItem = useCallback(async (itemId: string): Promise<DeleteItemResponse> => {
    const res = await apiDeleteJson<DeleteItemResponse>(`/items/${itemId}`, { timeoutMs: 30_000 })
    // Optimistically remove from the list — it's gone from Loyverse now.
    setItems((prev) => prev.filter((p) => p.id !== itemId))
    return res
  }, [])

  return { items, stores, isLoading, error, refetch: fetchItems, deleteItem }
}
