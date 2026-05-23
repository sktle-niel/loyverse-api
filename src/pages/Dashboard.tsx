// Dashboard page - Audit trail
import { useEffect, useMemo, useState } from 'react'
import { AuditFilters } from '../components/AuditFilters'
import { AuditTable, type AuditRecord } from '../components/AuditTable'
import { useAuditFilters } from '../hooks/useAuditFilters'
export function Dashboard() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'loyverse'>('mock')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // API connections removed for now.
    // Keep UI functional with empty/mock state.
    setAuditRecords([])
    setSource('mock')
    setErrorMessage(null)
    setIsLoading(false)
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

