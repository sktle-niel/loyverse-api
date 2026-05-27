// Dashboard page - Audit trail
import { useMemo } from 'react'
import { AuditFilters } from '../components/AuditFilters'
import { AuditTable } from '../components/AuditTable'
import { useAuditFilters } from '../hooks/useAuditFilters'
import { useAudit } from '../hooks/useAudit'

export function Dashboard() {
  const { auditRecords, isLoading, error, source } = useAudit()

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

  const sourceText = useMemo(() => {
    switch (source) {
      case 'mysql':
        return 'From approved requests (MySQL)'
      case 'loyverse':
        return 'Live from Loyverse'
      default:
        return 'Mock data'
    }
  }, [source])

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

        {error ? (
          <div className="alert alert-error mb-4">
            <div>
              <div className="font-semibold">Failed to load audit data</div>
              <div className="text-xs">{error}</div>
            </div>
          </div>
        ) : null}

        {/* Audit Table */}
        <AuditTable records={searchFilteredRecords} isLoading={isLoading} />
      </div>
    </div>
  )
}