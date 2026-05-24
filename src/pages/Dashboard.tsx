// Dashboard page - Audit trail
import { useEffect, useMemo, useState } from 'react'
import { AuditFilters } from '../components/AuditFilters'
import { AuditTable, type AuditRecord } from '../components/AuditTable'
import { useAuditFilters } from '../hooks/useAuditFilters'
import { readLocalStorageJson } from '../utils/storage'

export function Dashboard() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'loyverse'>('mock')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load audit from localStorage (populated by Inventory page)
    try {
      const fromLs = readLocalStorageJson<AuditRecord[]>('inventory.audit.v1')
      const arr = Array.isArray(fromLs) ? fromLs : []
      // Sort desc by timestamp (newest first)
      arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setAuditRecords(arr)
      setSource('mock')
      setErrorMessage(null)
    } catch (e) {

      setAuditRecords([])
      setSource('mock')
      setErrorMessage('Failed to load audit from local storage')
    } finally {
      setIsLoading(false)
    }
  }, [])


  const {
    filteredRecords: searchFilteredRecords,
    searchTerm,
    onSearchChange,
    branchId,
    onBranchChange,
    direction,
    onDirectionChange,
    branches,
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
          onSearchChange={onSearchChange}
          branchId={branchId}
          onBranchChange={onBranchChange}
          direction={direction}
          onDirectionChange={onDirectionChange}
          onClearFilters={onClearFilters}
          branches={branches}
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

