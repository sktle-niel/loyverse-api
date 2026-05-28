import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [loadingHint, setLoadingHint] = useState<string | null>(null)

  const slowHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const verySlowHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHintTimers = () => {
    if (slowHintTimer.current) { clearTimeout(slowHintTimer.current); slowHintTimer.current = null }
    if (verySlowHintTimer.current) { clearTimeout(verySlowHintTimer.current); verySlowHintTimer.current = null }
  }

  const fetchCatalog = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    setLoadingHint(null)
    clearHintTimers()

    if (!refresh) {
      slowHintTimer.current = setTimeout(() => {
        setLoadingHint('Fetching catalog from Loyverse — this can take a minute on first load…')
      }, 8_000)

      verySlowHintTimer.current = setTimeout(() => {
        setLoadingHint('Still loading… the server is fetching your full product list from Loyverse.')
      }, 30_000)
    }

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
      const msg = e instanceof Error ? e.message : 'Failed to fetch products'
      const isServerWakingUp = msg.includes('Route GET') || msg.includes('timed out')
      if (isServerWakingUp) {
        setError('Server is starting up — the catalog may take a minute to load. Please wait and try refreshing again.')
      } else {
        setError(msg)
        if (!refresh) {
          setAllProducts([])
          setCatalogTotal(0)
        }
        setCatalogNote(undefined)
      }
    } finally {
      clearHintTimers()
      setLoadingHint(null)
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
    loadingHint,
    submitStockChange,
    refreshCatalog: () => fetchCatalog(true),
  }
}
