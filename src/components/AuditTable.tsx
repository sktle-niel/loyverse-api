// Audit trail table component
import { useState } from 'react'
import type { AuditRecord } from '../api/types'

function getBranchName(branchId?: string): string {
  if (!branchId) return '—'
  return branchId
}


interface AuditTableProps {
  records: AuditRecord[]
  isLoading?: boolean
}

const ITEMS_PER_PAGE = 15

export function AuditTable({ records, isLoading = false }: AuditTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body items-center justify-center py-8">
          <p className="text-base-content/60 text-center">
            No audit records found
          </p>
        </div>
      </div>
    )
  }

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRecords = records.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (safePage > 1) setCurrentPage(safePage - 1)
  }

  const handleNextPage = () => {
    if (safePage < totalPages) setCurrentPage(safePage + 1)
  }

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="table text-sm">
        <thead className="bg-base-200">
          <tr className="border-b border-base-300">
            <th className="text-base-content font-semibold">Item</th>
            <th className="text-base-content font-semibold">Branch</th>
            <th className="text-base-content font-semibold">New Stock</th>
            <th className="text-base-content font-semibold">Change</th>
            <th className="text-base-content font-semibold">Timestamp</th>
          </tr>
        </thead>
           <tbody>
             {paginatedRecords.map((record) => (
               <tr key={record.id} className="border-b border-base-200 hover:bg-base-200/30 transition-colors">
                 <td className="text-base-content font-medium">{record.itemName}</td>
                 <td className="text-base-content/70">{getBranchName(record.branchId)}</td>
                 <td className="text-base-content/70">{record.newStock}</td>
                 <td>
                   <div
                     className={`font-semibold ${
                       record.changeAmount < 0
                         ? 'text-error'
                         : 'text-success'
                     }`}
                   >
                     {record.changeAmount > 0 ? '+' : ''}{record.changeAmount}
                   </div>
                 </td>
                 <td className="text-base-content/60 text-sm">
                   {new Date(record.timestamp).toLocaleString()}
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

       {/* Mobile List View */}
       <div className="sm:hidden divide-y divide-base-200">
         {paginatedRecords.map((record) => (
           <div key={record.id} className="p-3 space-y-2">
             <div className="flex justify-between items-start">
               <div className="flex-1">
                 <p className="font-medium text-base-content text-sm">{record.itemName}</p>
                 <p className="text-xs text-base-content/60">
                    Branch: {getBranchName(record.branchId)} · by {record.adminName}
                  </p>
               </div>
               <div
                 className={`font-semibold text-sm ${
                   record.changeAmount < 0
                     ? 'text-error'
                     : 'text-success'
                 }`}
               >
                 {record.changeAmount > 0 ? '+' : ''}{record.changeAmount}
               </div>
             </div>
             <div className="flex justify-between text-xs text-base-content/60">
               <span>{record.newStock}</span>
               <span>{new Date(record.timestamp).toLocaleString()}</span>
             </div>
           </div>
         ))}
        </div>
       {/* Pagination Controls */}
      <div className="card-body border-t border-base-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-base-content/60 text-center sm:text-left">
          Showing {startIndex + 1} to {Math.min(endIndex, records.length)} of {records.length} records
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
          <button
            className="btn btn-sm btn-outline text-xs"
            onClick={handlePreviousPage}
            disabled={safePage === 1}
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-base-content whitespace-nowrap">
              {safePage} / {totalPages}
            </span>
          </div>
          <button
            className="btn btn-sm btn-outline text-xs"
            onClick={handleNextPage}
            disabled={safePage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
