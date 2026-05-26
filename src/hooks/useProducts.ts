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
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiFetchJson<ProductsResponse>('/products')
      setProducts(response.products)
      setStores(response.stores)
      setSource(response.source)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  const submitStockChange = async (
    itemId: string,
    body: SubmitStockRequestBody,
  ): Promise<SubmitStockRequestResponse> => {
    return apiPatchJson<SubmitStockRequestResponse>(`/products/${itemId}/stock`, body)
  }

  return {
    products,
    stores,
    source,
    isLoading,
    error,
    submitStockChange,
    refetch: fetchProducts,
  }
}
