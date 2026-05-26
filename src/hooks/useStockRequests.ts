import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson, apiPostJson } from '../api/client'
import type {
  ApproveStockRequestResponse,
  StockChangeRequest,
  StockRequestStatus,
  StockRequestsResponse,
} from '../api/types'

export function useStockRequests(initialStatus: StockRequestStatus = 'pending') {
  const [requests, setRequests] = useState<StockChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async (status: StockRequestStatus = initialStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiFetchJson<StockRequestsResponse>(
        `/stock-requests?status=${status}`,
      )
      setRequests(response.requests)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch stock requests')
    } finally {
      setIsLoading(false)
    }
  }, [initialStatus])

  useEffect(() => {
    void fetchRequests(initialStatus)
  }, [fetchRequests, initialStatus])

  const approveRequest = async (
    id: string,
    reviewedBy = 'Admin',
  ): Promise<ApproveStockRequestResponse> => {
    const response = await apiPostJson<ApproveStockRequestResponse>(
      `/stock-requests/${id}/approve`,
      { reviewedBy },
    )
    setRequests((prev) => prev.filter((r) => r.id !== id))
    return response
  }

  const rejectRequest = async (
    id: string,
    reviewedBy = 'Admin',
    rejectionReason?: string,
  ): Promise<void> => {
    await apiPostJson(`/stock-requests/${id}/reject`, {
      reviewedBy,
      rejectionReason,
    })
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return { requests, isLoading, error, approveRequest, rejectRequest, refetch: fetchRequests }
}
