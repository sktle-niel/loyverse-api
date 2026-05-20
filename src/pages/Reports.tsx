// Reports page with analytics and statistics
import { useEffect, useState } from 'react'
import { MOCK_AUDIT_RECORDS } from './Dashboard'

type StockTab = 'in-stock' | 'low-stock' | 'out-of-stock'

const ITEMS_PER_PAGE = 15

export function Reports() {
  const [activeTab, setActiveTab] = useState<StockTab>('out-of-stock')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Get current stock for each item (latest entry)
  const itemStocks = new Map<string, number>()
  MOCK_AUDIT_RECORDS.forEach((record) => {
    itemStocks.set(record.itemName, record.newStock)
  })

  // Categorize inventory status
  const outOfStock: [string, number][] = []
  const lowStock: [string, number][] = []
  const inStock: [string, number][] = []

  itemStocks.forEach((stock, itemName) => {
    if (stock === 0) {
      outOfStock.push([itemName, stock])
    } else if (stock < 4) {
      lowStock.push([itemName, stock])
    } else {
      inStock.push([itemName, stock])
    }
  })

  // Sort by stock level (ascending)
  outOfStock.sort((a, b) => a[1] - b[1])
  lowStock.sort((a, b) => a[1] - b[1])
  inStock.sort((a, b) => a[1] - b[1])

  const filterBySearch = (items: [string, number][]) => {
    return items.filter(([itemName]) =>
      itemName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredInStock = filterBySearch(inStock)
  const filteredLowStock = filterBySearch(lowStock)
  const filteredOutOfStock = filterBySearch(outOfStock)

  const activeItems =
    activeTab === 'in-stock'
      ? filteredInStock
      : activeTab === 'low-stock'
        ? filteredLowStock
        : filteredOutOfStock

  const stockColorClass =
    activeTab === 'in-stock'
      ? 'text-success'
      : activeTab === 'low-stock'
        ? 'text-warning'
        : 'text-error'

  const emptyMessage =
    searchTerm.trim() !== ''
      ? 'No items match your search'
      : activeTab === 'in-stock'
        ? 'No items in stock'
        : activeTab === 'low-stock'
          ? 'No low stock items'
          : 'No items out of stock'

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm])

  const totalPages = Math.max(1, Math.ceil(activeItems.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedItems = activeItems.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (safePage > 1) setCurrentPage(safePage - 1)
  }

  const handleNextPage = () => {
    if (safePage < totalPages) setCurrentPage(safePage + 1)
  }

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            Reports
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">
            Inventory status and audit analytics
          </p>
        </div>

        {/* Tab Controls */}
        <div role="tablist" className="tabs tabs-boxed mb-4 sm:mb-6 w-full sm:w-auto">
          <button
            role="tab"
            type="button"
            className={`tab ${activeTab === 'out-of-stock' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('out-of-stock')}
          >
            Out of Stock ({outOfStock.length})
          </button>
          <button
            role="tab"
            type="button"
            className={`tab ${activeTab === 'low-stock' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('low-stock')}
          >
            Low Stock ({lowStock.length})
          </button>
          <button
            role="tab"
            type="button"
            className={`tab ${activeTab === 'in-stock' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('in-stock')}
          >
            In Stock ({inStock.length})
          </button>
        </div>

        {/* Search */}
        <div className="form-control mb-4 sm:mb-6 max-w-md">
          <label className="label py-2">
            <span className="label-text font-semibold text-base-content text-xs sm:text-sm">
              Search
            </span>
          </label>
          <input
            type="text"
            placeholder="Item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full focus:input-primary text-sm"
          />
        </div>

        {/* Inventory Table */}
        <div className="card bg-base-100 shadow border border-base-200">
          {activeItems.length === 0 ? (
            <div className="card-body items-center justify-center py-8">
              <p className="text-base-content/60 text-center">{emptyMessage}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead className="bg-base-200">
                    <tr className="border-b border-base-300">
                      <th className="text-base-content font-semibold">Item</th>
                      <th className="text-base-content font-semibold">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map(([item, stock]) => (
                      <tr
                        key={item}
                        className="border-b border-base-200 hover:bg-base-200/30 transition-colors"
                      >
                        <td className="text-base-content font-medium">{item}</td>
                        <td>
                          <span className={`font-semibold ${stockColorClass}`}>{stock}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-body border-t border-base-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-base-content/60 text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, activeItems.length)} of{' '}
                  {activeItems.length} items
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline text-xs"
                    onClick={handlePreviousPage}
                    disabled={safePage === 1}
                  >
                    ← Prev
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-base-content whitespace-nowrap">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline text-xs"
                    onClick={handleNextPage}
                    disabled={safePage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
