import { useCallback, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { StockLevelProduct, StoreInfo } from '../api/types'

interface ItemStockResponse {
  products: StockLevelProduct[]
  stores: StoreInfo[]
  accurate: boolean
}

export function useItemStock() {
  const [products, setProducts] = useState<StockLevelProduct[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [accurate, setAccurate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setProducts([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await apiFetchJson<ItemStockResponse>(
        `/item-stock?q=${encodeURIComponent(trimmed)}`,
        { timeoutMs: 45_000 },
      )
      setProducts(res.products)
      setStores(res.stores)
      setAccurate(res.accurate)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setProducts([])
    setError(null)
    setAccurate(false)
  }, [])

  return { products, stores, accurate, isLoading, error, search, clear }
}
