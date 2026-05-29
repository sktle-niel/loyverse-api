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
      case 'mysql': return 'From approved requests'
      case 'loyverse': return 'Live from Loyverse'
      default: return 'Mock data'
    }
  }, [source])

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Audit trail</h1>
          <p className="text-sm text-base-content/45 mt-1">{sourceText} · monitor stock changes made by admins</p>
        </header>

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
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-medium">Failed to load audit data</p>
              <p className="text-xs mt-0.5 text-error/70">{error}</p>
            </div>
          </div>
        ) : null}

        <AuditTable records={searchFilteredRecords} isLoading={isLoading} />
      </div>
    </main>
  )
}
