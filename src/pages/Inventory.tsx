import { useEffect, useMemo, useState } from 'react'
import { SuccessToast } from '../components/SuccessToast'
import type { AuditRecord } from '../components/AuditTable'
import { readLocalStorageJson, writeLocalStorageJson } from '../utils/storage'

type BranchId = 'branch-001' | 'branch-002' | 'branch-003'

type StockCell = {
  branchId: BranchId
  stock: number
}

type Product = {
  id: string
  name: string
  sku: string
  stocks: StockCell[] // per branch
}

const BRANCHES: { id: BranchId; name: string }[] = [
  { id: 'branch-001', name: 'Main Branch' },
  { id: 'branch-002', name: 'North Branch' },
  { id: 'branch-003', name: 'South Branch' },
]

const PRODUCTS: Product[] = [
  {
    id: 'p-001',
    name: 'Mobil 1 Engine Oil 1L',
    sku: 'MOB-1L-001',
    stocks: [
      { branchId: 'branch-001', stock: 14 },
      { branchId: 'branch-002', stock: 7 },
      { branchId: 'branch-003', stock: 3 },
    ],
  },
  {
    id: 'p-002',
    name: 'Castrol GTX 5W-30',
    sku: 'CAS-5W30-002',
    stocks: [
      { branchId: 'branch-001', stock: 22 },
      { branchId: 'branch-002', stock: 10 },
      { branchId: 'branch-003', stock: 8 },
    ],
  },
  {
    id: 'p-003',
    name: 'Oil Filter',
    sku: 'OIL-FLT-010',
    stocks: [
      { branchId: 'branch-001', stock: 9 },
      { branchId: 'branch-002', stock: 5 },
      { branchId: 'branch-003', stock: 2 },
    ],
  },
]

function stockKey(productId: string, branchId: BranchId) {
  return `${productId}::${branchId}`
}

function getStock(product: Product, branchId: BranchId): number {
  return product.stocks.find((s) => s.branchId === branchId)?.stock ?? 0
}

const LS_PRODUCTS_KEY = 'inventory.products.v1'
const LS_AUDIT_KEY = 'inventory.audit.v1'

function nowIso() {
  return new Date().toISOString()
}

const ITEMS_PER_PAGE = 10

export function Inventory() {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = readLocalStorageJson<Product[]>(LS_PRODUCTS_KEY)
    return saved && Array.isArray(saved) ? saved : PRODUCTS
  })

  // Editable buffer (local only for now)
  const [draftStocks, setDraftStocks] = useState<Record<string, string>>({})
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(() => new Set())
  const [savingProductId, setSavingProductId] = useState<string | null>(null)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, query])

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const ensureDraftValue = (p: Product, branchId: BranchId) => {
    const k = stockKey(p.id, branchId)
    if (draftStocks[k] !== undefined) return

    const current = getStock(p, branchId)
    setDraftStocks((prev) => ({ ...prev, [k]: String(current) }))
  }

  const setDraft = (p: Product, branchId: BranchId, value: string) => {
    const k = stockKey(p.id, branchId)
    setDraftStocks((prev) => ({ ...prev, [k]: value }))

    setDirtyKeys((prev) => {
      const next = new Set(prev)
      next.add(k)
      return next
    })
  }

  const validateStock = (raw: string): number | null => {
    const v = raw.trim()
    if (v === '') return null
    if (!/^\d+$/.test(v)) return null
    return Number(v)
  }

  const saveProduct = async (p: Product) => {
    // Snapshot dirty state for this product only (prevents UI from affecting other products)
    const productDirtyKeys = new Set<string>()
    for (const s of p.stocks) {
      const k = stockKey(p.id, s.branchId)
      if (dirtyKeys.has(k)) productDirtyKeys.add(k)
    }

    if (productDirtyKeys.size === 0) return

    setSavingProductId(p.id)

    const updated: Product = {
      ...p,
      stocks: p.stocks.map((s) => {
        const k = stockKey(p.id, s.branchId)
        if (!productDirtyKeys.has(k)) return s

        const validated = validateStock(draftStocks[k] ?? '')
        if (validated === null) return s
        return { ...s, stock: validated }
      }),
    }

    // Build audit records (one per branch stock change)
    const userAdminName = 'Local Admin'
    const newAuditRecords: AuditRecord[] = []

    for (const s of p.stocks) {
      const k = stockKey(p.id, s.branchId)
      if (!productDirtyKeys.has(k)) continue

      const oldStock = s.stock
      const validated = validateStock(draftStocks[k] ?? '')
      if (validated === null) continue

      const changeAmount = validated - oldStock

      newAuditRecords.push({
        id: `${p.id}-${s.branchId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        itemName: p.name,
        adminName: userAdminName,
        branchId: s.branchId,
        oldStock,
        newStock: validated,
        changeAmount,
        timestamp: nowIso(),
      })
    }

    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)))

    // Persist to localStorage
    const allAudit = readLocalStorageJson<AuditRecord[]>(LS_AUDIT_KEY) ?? []
    const mergedAudit = [...allAudit, ...newAuditRecords]
    writeLocalStorageJson(LS_AUDIT_KEY, mergedAudit)
    writeLocalStorageJson(LS_PRODUCTS_KEY, updated)

    setDirtyKeys((prev) => {
      const next = new Set(prev)
      for (const k of productDirtyKeys) next.delete(k)
      return next
    })

    setDraftStocks((prev) => {
      const next = { ...prev }
      for (const k of productDirtyKeys) delete next[k]
      return next
    })

    await new Promise((r) => setTimeout(r, 350))
    setSavingProductId(null)

    setToastMessage(`Stock updated for ${p.name}.`)
    setToastOpen(true)
  }

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <SuccessToast open={toastOpen} message={toastMessage} durationMs={6000} onClose={() => setToastOpen(false)} />

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">Inventory Stock</h1>
          <p className="text-base-content/60 text-sm sm:text-base">
            Edit stock per product for each branch. Changes are saved locally for now.
          </p>
        </div>

        {/* Search */}
        <div className="form-control mb-4 sm:mb-6 max-w-md">
          <label className="label py-2">
            <span className="label-text font-semibold text-base-content text-xs sm:text-sm">Search</span>
          </label>
          <input
            type="text"
            placeholder="Product name or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-bordered w-full focus:input-primary text-sm"
          />
        </div>

        {/* Products */}
        <div className="space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body py-10">
                <p className="text-base-content/60">No products match your search.</p>
              </div>
            </div>
          ) : (
            <>
              {paginatedProducts.map((p) => {
                const isSaving = savingProductId === p.id
                const hasChanges = Array.from(dirtyKeys).some((k) => k.startsWith(`${p.id}::`))

                return (
                  <div key={p.id} className="card bg-base-100 shadow border border-base-200">
                    <div className="card-body">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <div>
                          <div className="font-bold text-base-content text-lg">{p.name}</div>
                          <div className="text-xs text-base-content/60">SKU: {p.sku}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            type="button"
                            disabled={isSaving || !hasChanges}
                            onClick={() => saveProduct(p)}
                            title={hasChanges ? 'Save changes' : 'No changes'}
                          >
                            {isSaving ? 'Saving...' : 'Save stock'}
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="table table-zebra text-sm">
                          <thead>
                            <tr>
                              <th className="w-64">Branch</th>
                              {BRANCHES.map((b) => (
                                <th key={b.id} className="text-center">
                                  {b.name}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            <tr>
                              <td className="font-medium">Stock</td>
                              {BRANCHES.map((b) => {
                                const k = stockKey(p.id, b.id)
                                const isDirty = dirtyKeys.has(k)

                                const value =
                                  draftStocks[k] !== undefined ? draftStocks[k] : String(getStock(p, b.id))

                                return (
                                  <td key={k} className="min-w-[140px]">
                                    <div className="flex items-center justify-center">
                                      <input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className={`input input-bordered input-sm w-24 text-right ${
                                          isDirty ? 'input-warning' : ''
                                        }`}
                                        value={value}
                                        onFocus={() => ensureDraftValue(p, b.id)}
                                        onChange={(ev) => setDraft(p, b.id, ev.target.value)}
                                      />
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Pagination Controls */}
              <div className="card-body border-t border-base-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-base-content/60 text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}{' '}
                  products
                </div>

                <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline text-xs"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

