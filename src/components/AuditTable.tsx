import { useMemo, useState } from 'react'
import type { AuditRecord } from '../api/types'
import { useStores } from '../hooks/useStores'

interface AuditTableProps {
  records: AuditRecord[]
  isLoading?: boolean
}

const ITEMS_PER_PAGE = 15

function SkeletonRow() {
  return (
    <tr className="border-b border-base-content/6">
      {[40, 24, 16, 16, 28].map((w, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className={`h-3 rounded bg-base-content/8 animate-pulse`} style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function AuditTable({ records, isLoading = false }: AuditTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const { stores } = useStores()
  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )
  const getBranchName = (branchId?: string) =>
    branchId ? (storeNameById.get(branchId) ?? branchId) : '—'

  if (isLoading) {
    return (
      <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-content/8 bg-base-content/3">
                <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">New stock</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Change</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-base-content/8 bg-base-100 py-16 text-center">
        <p className="text-sm text-base-content/40">No audit records found</p>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRecords = records.slice(startIndex, endIndex)

  return (
    <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-content/8 bg-base-content/3">
              <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide tabular">New stock</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Change</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record, index) => (
              <tr
                key={record.id}
                className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <td className="py-3.5 px-4 font-medium text-base-content">{record.itemName}</td>
                <td className="py-3.5 px-4 text-base-content/60">{getBranchName(record.branchId)}</td>
                <td className="py-3.5 px-4 text-base-content/60 tabular">{record.newStock}</td>
                <td className="py-3.5 px-4">
                  <span className={`tabular font-semibold text-sm ${record.changeAmount < 0 ? 'text-error' : 'text-success'}`}>
                    {record.changeAmount > 0 ? '+' : ''}{record.changeAmount}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">
                  {new Date(record.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="sm:hidden divide-y divide-base-content/6">
        {paginatedRecords.map((record, index) => (
          <div
            key={record.id}
            className="px-4 py-3.5 space-y-1.5 animate-row"
            style={{ animationDelay: `${index * 25}ms` }}
          >
            <div className="flex justify-between items-start gap-4">
              <p className="font-medium text-base-content text-sm leading-tight">{record.itemName}</p>
              <span className={`tabular font-semibold text-sm shrink-0 ${record.changeAmount < 0 ? 'text-error' : 'text-success'}`}>
                {record.changeAmount > 0 ? '+' : ''}{record.changeAmount}
              </span>
            </div>
            <div className="flex justify-between text-xs text-base-content/45">
              <span>{getBranchName(record.branchId)} · by {record.adminName}</span>
              <span className="tabular">{new Date(record.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
        <p className="text-xs text-base-content/40">
          {startIndex + 1}–{Math.min(endIndex, records.length)} of {records.length} records
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content"
            onClick={() => setCurrentPage(safePage - 1)}
            disabled={safePage === 1}
          >
            ← Prev
          </button>
          <span className="text-xs text-base-content/60 tabular px-1">{safePage} / {totalPages}</span>
          <button
            type="button"
            className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content"
            onClick={() => setCurrentPage(safePage + 1)}
            disabled={safePage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
