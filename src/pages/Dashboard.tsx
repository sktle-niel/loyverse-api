// Dashboard page - Audit trail
import { useEffect, useMemo, useState } from 'react'
import { AuditFilters } from '../components/AuditFilters'
import { AuditTable, type AuditRecord } from '../components/AuditTable'
import { useAuditFilters } from '../hooks/useAuditFilters'
import type { AuditResponse } from '../api/types'
import { apiFetchJson } from '../api/client'

export function Dashboard() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'loyverse'>('loyverse')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await apiFetchJson<AuditResponse>('/api/audit')
        if (cancelled) return
        setAuditRecords(data.records)
        setSource(data.source)
      } catch (e) {
        if (cancelled) return

        setAuditRecords([])
        setSource('loyverse')

        const msg = e instanceof Error ? e.message : 'Failed to fetch audit records'
        setErrorMessage(msg)
        console.error('Failed to fetch /api/audit:', e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const {
    filteredRecords: searchFilteredRecords,
    searchTerm,
    selectedItem,
    dateFrom,
    dateTo,
    items,
    onSearchChange,
    onItemChange,
    onDateFromChange,
    onDateToChange,
    onClearFilters,
  } = useAuditFilters(auditRecords)

  const sourceText = useMemo(() => (source === 'loyverse' ? 'Live from Loyverse' : 'Mock data'), [source])

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            Audit Trail
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">{sourceText}</p>
          <p className="text-base-content/60 text-sm sm:text-base">
            Monitor stock changes made by admins
          </p>
        </div>

        {/* Filters */}
        <AuditFilters
          searchTerm={searchTerm}
          selectedItem={selectedItem}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSearchChange={onSearchChange}
          onItemChange={onItemChange}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onClearFilters={onClearFilters}
          items={items}
        />

        {errorMessage ? (
          <div className="alert alert-error mb-4">
            <div>
              <div className="font-semibold">Failed to load audit data</div>
              <div className="text-xs">{errorMessage}</div>
            </div>
          </div>
        ) : null}

        {/* Audit Table */}
        <AuditTable records={searchFilteredRecords} isLoading={isLoading} />
      </div>
    </div>
  )
}

