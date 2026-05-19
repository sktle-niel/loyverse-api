// Audit trail table component
import { useState } from 'react'

export interface AuditRecord {
  id: string
  itemName: string
  adminName: string
  oldStock: number
  newStock: number
  changeAmount: number
  timestamp: string
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
  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRecords = records.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  // Calculate current stock per item (latest stock for each unique item)
  const itemStocks = new Map<string, number>()
  records.forEach((record) => {
    itemStocks.set(record.itemName, record.newStock)
  })

  return (
    <div className="card bg-base-100 shadow border border-base-200 overflow-x-auto">
      <div className="w-full overflow-x-auto">
        <table className="table text-xs sm:text-sm">
          <thead className="bg-base-200">
            <tr className="border-b border-base-300">
              <th className="text-base-content font-semibold">Item</th>
              <th className="text-base-content font-semibold hidden sm:table-cell">Old Stock</th>
              <th className="text-base-content font-semibold">New Stock</th>
              <th className="text-base-content font-semibold">Change</th>
              <th className="text-base-content font-semibold hidden lg:table-cell">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record) => (
              <tr key={record.id} className="border-b border-base-200 hover:bg-base-200/30 transition-colors">
                <td className="text-base-content font-medium text-xs sm:text-sm">{record.itemName}</td>
                <td className="text-base-content/70 hidden sm:table-cell">{record.oldStock}</td>
                <td className="text-base-content/70">{record.newStock}</td>
                <td>
                  <div
                    className={`font-semibold text-xs sm:text-sm ${
                      record.changeAmount < 0
                        ? 'text-error'
                        : 'text-success'
                    }`}
                  >
                    {record.changeAmount > 0 ? '+' : ''}{record.changeAmount}
                  </div>
                </td>
                <td className="text-base-content/60 text-xs hidden lg:table-cell">
                  {new Date(record.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-base-content whitespace-nowrap">
              {currentPage} / {totalPages}
            </span>
          </div>
          <button
            className="btn btn-sm btn-outline text-xs"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
