import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { StoreInfo } from '../api/types'

export function useStores() {
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStores = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiFetchJson<{ stores: StoreInfo[]; source: string }>('/stores')
      setStores(response.stores)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch stores')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStores()
  }, [fetchStores])

  return { stores, isLoading, error, refetch: fetchStores }
}
