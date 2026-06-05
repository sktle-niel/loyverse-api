import { useCallback, useState } from 'react'
import { apiFetchJson, apiPostJson, apiPatchJson } from '../api/client'
import type { TransferRequest, TransferRequestsResponse, PendingTransferStock, PendingTransferStocksResponse } from '../api/types'

export function useTransferRequests() {
  const [requests, setRequests] = useState<TransferRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async (status?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const url = status ? `/transfer-requests?status=${status}` : '/transfer-requests'
      const res = await apiFetchJson<TransferRequestsResponse>(url)
      setRequests(res.requests)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch transfer requests')
    } finally {
      setIsLoading(false)
      setHasFetched(true)
    }
  }, [])

  const submitTransfer = useCallback(async (body: {
    itemId: string
    fromStoreId: string
    toStoreId: string
    quantity: number
    requestedBy: string
  }) => {
    return apiPostJson<{ request: TransferRequest; message: string }>('/transfer-requests', body)
  }, [])

  const approveTransfer = useCallback(async (id: string, reviewedBy: string) => {
    return apiPatchJson<{ request: TransferRequest; message: string }>(
      `/transfer-requests/${id}/approve`,
      { reviewedBy },
      { timeoutMs: 60_000 },
    )
  }, [])

  const rejectTransfer = useCallback(async (id: string, reviewedBy: string, reason?: string) => {
    return apiPatchJson<{ request: TransferRequest; message: string }>(
      `/transfer-requests/${id}/reject`,
      { reviewedBy, reason },
    )
  }, [])

  const cancelTransfer = useCallback(async (id: string, cancelledBy: string, isAdmin: boolean) => {
    return apiPatchJson<{ request: TransferRequest; message: string }>(
      `/transfer-requests/${id}/cancel`,
      { cancelledBy, isAdmin },
    )
  }, [])

  const fetchPendingStocks = useCallback(async (): Promise<PendingTransferStock[]> => {
    const res = await apiFetchJson<PendingTransferStocksResponse>('/transfer-requests/pending-stocks')
    return res.stocks
  }, [])

  return {
    requests,
    isLoading,
    hasFetched,
    error,
    fetchRequests,
    submitTransfer,
    approveTransfer,
    rejectTransfer,
    cancelTransfer,
    fetchPendingStocks,
  }
}
