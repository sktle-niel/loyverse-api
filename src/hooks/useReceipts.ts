import { useCallback, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type {
  Receipt,
  ReceiptEmployee,
  ReceiptsResponse,
  ReceiptsSummary,
  StoreInfo,
} from '../api/types'

const EMPTY_SUMMARY: ReceiptsSummary = { receipts: 0, sales: 0, refunds: 0, totalSales: 0 }

export interface ReceiptFilters {
  from: string // ISO datetime
  to: string // ISO datetime
  storeId?: string
  employeeId?: string
}

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [summary, setSummary] = useState<ReceiptsSummary>(EMPTY_SUMMARY)
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [employees, setEmployees] = useState<ReceiptEmployee[]>([])
  const [source, setSource] = useState<'loyverse' | 'mock'>('mock')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (filters: ReceiptFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      qs.set('from', filters.from)
      qs.set('to', filters.to)
      if (filters.storeId) qs.set('storeId', filters.storeId)
      if (filters.employeeId) qs.set('employeeId', filters.employeeId)
      const res = await apiFetchJson<ReceiptsResponse>(`/receipts?${qs.toString()}`, { timeoutMs: 120_000 })
      setReceipts(res.receipts)
      setSummary(res.summary)
      setStores(res.stores)
      setEmployees(res.employees)
      setSource(res.source)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load receipts'
      setError(msg.includes('timed out') ? 'Server is still loading receipts. Please wait and try again.' : msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { receipts, summary, stores, employees, source, isLoading, error, load }
}
