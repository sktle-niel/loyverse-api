import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson, apiPatchJson } from '../api/client'
import type {
  Product,
  ProductsResponse,
  StoreInfo,
  SubmitStockRequestBody,
  SubmitStockRequestResponse,
} from '../api/types'

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [catalogNote, setCatalogNote] = useState<string | undefined>()
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [cachedAt, setCachedAt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalog = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const path = refresh ? '/products?refresh=1' : '/products'
      const response = await apiFetchJson<ProductsResponse>(path, { timeoutMs: 120_000 })
      setAllProducts(response.products)
      setStores(response.stores)
      setSource(response.source)
      setCatalogNote(response.catalogNote)
      setCatalogTotal(response.catalogTotal ?? response.products.length)
      setCachedAt(response.cachedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch products')
      if (!refresh) {
        setAllProducts([])
        setCatalogTotal(0)
      }
      setCatalogNote(undefined)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchCatalog(false)
  }, [fetchCatalog])

  const submitStockChange = async (
    itemId: string,
    body: SubmitStockRequestBody,
  ): Promise<SubmitStockRequestResponse> => {
    const payload =
      body.storeId != null && body.stock != null
        ? { storeId: body.storeId, stock: body.stock, requestedBy: body.requestedBy }
        : body
    return apiPatchJson<SubmitStockRequestResponse>(`/products/${itemId}/stock`, payload, {
      timeoutMs: 60_000,
    })
  }

  return {
    allProducts,
    stores,
    source,
    catalogNote,
    catalogTotal,
    cachedAt,
    isLoading,
    isRefreshing,
    error,
    submitStockChange,
    refreshCatalog: () => fetchCatalog(true),
  }
}
