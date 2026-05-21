// Reports page with analytics and statistics
import { useEffect, useMemo, useState } from 'react'
import type { InventoryItem, InventoryResponse, InventoryStatus } from '../api/types'
import { apiFetchJson } from '../api/client'

type StockTab = InventoryStatus

const ITEMS_PER_PAGE = 15
type TabBucket = Record<StockTab, InventoryItem[]>

export function Reports() {
  const [activeTab, setActiveTab] = useState<StockTab>('out-of-stock')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'loyverse'>('mock')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await apiFetchJson<InventoryResponse>('/api/inventory')
        if (cancelled) return
        setItems(data.items)
        setSource(data.source)
      } catch {
        if (cancelled) return
        setItems([])
        setSource('mock')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const buckets: TabBucket = useMemo(() => {
    const b: TabBucket = {
      'in-stock': [],
      'low-stock': [],
      'out-of-stock': [],
    }

    for (const it of items) {
      b[it.status].push(it)
    }

    // sort by stock asc (matches old behavior)
    for (const k of Object.keys(b) as StockTab[]) {
      b[k].sort((a, c) => a.stock - c.stock)
    }

    return b
  }, [items])

  const emptyMessage =
    searchTerm.trim() !== ''
      ? 'No items match your search'
      : activeTab === 'in-stock'
        ? 'No items in stock'
        : activeTab === 'low-stock'
          ? 'No low stock items'
          : 'No items out of stock'

  const filteredBySearch = (arr: InventoryItem[]) => {
    if (!searchTerm.trim()) return arr
    const q = searchTerm.toLowerCase()
    return arr.filter((it) => it.itemName.toLowerCase().includes(q))
  }

  const activeItems = useMemo(() => {
    return filteredBySearch(buckets[activeTab])
  }, [buckets, activeTab, searchTerm])

  const stockColorClass =
    activeTab === 'in-stock'
      ? 'text-success'
      : activeTab === 'low-stock'
        ? 'text-warning'
        : 'text-error'

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

  const sourceText = source === 'loyverse' ? 'Live from Loyverse' : 'Mock/empty'

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            Reports
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">{sourceText}</p>
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
            Out of Stock ({buckets['out-of-stock'].length})
          </button>
          <button
            role="tab"
            type="button"
            className={`tab ${activeTab === 'low-stock' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('low-stock')}
          >
            Low Stock ({buckets['low-stock'].length})
          </button>
          <button
            role="tab"
            type="button"
            className={`tab ${activeTab === 'in-stock' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('in-stock')}
          >
            In Stock ({buckets['in-stock'].length})
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
          {isLoading ? (
            <div className="card-body items-center justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : activeItems.length === 0 ? (
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
                    {paginatedItems.map((it) => (
                      <tr
                        key={it.itemName}
                        className="border-b border-base-200 hover:bg-base-200/30 transition-colors"
                      >
                        <td className="text-base-content font-medium">{it.itemName}</td>
                        <td>
                          <span className={`font-semibold ${stockColorClass}`}>{it.stock}</span>
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

