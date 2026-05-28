import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { StockChangeRequest, StockRequestStatus, StockRequestsResponse } from '../api/types'

type TabStatus = StockRequestStatus | 'all'

export function useMyStockRequests(initialStatus: TabStatus = 'all') {
  const [requests, setRequests] = useState<StockChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async (status: TabStatus = initialStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const path =
        status === 'all'
          ? '/stock-requests/mine'
          : `/stock-requests/mine?status=${status}`
      const response = await apiFetchJson<StockRequestsResponse>(path)
      setRequests(response.requests)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch requests')
    } finally {
      setIsLoading(false)
    }
  }, [initialStatus])

  useEffect(() => {
    void fetchRequests(initialStatus)
  }, [fetchRequests, initialStatus])

  return { requests, isLoading, error, refetch: fetchRequests }
}
