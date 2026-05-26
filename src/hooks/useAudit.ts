import { useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { AuditRecord, AuditResponse } from '../api/types'

export function useAudit() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'mock' | 'loyverse'>('mock')

  useEffect(() => {
    const fetchAudit = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await apiFetchJson<AuditResponse>('/audit')
        setAuditRecords(response.records)
        setSource(response.source)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch audit records')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAudit()
  }, [])

  return { auditRecords, isLoading, error, source }
}