import { useMemo, useState } from 'react'

type BranchId = 'branch-001' | 'branch-002' | 'branch-003'

type EmployeeId = 'emp-001' | 'emp-002' | 'emp-003'

type StockCell = {
  branchId: BranchId
  employeeId: EmployeeId
  stock: number
}

type Product = {
  id: string
  name: string
  sku: string
  stocks: StockCell[] // per branch/employee
}

const BRANCHES: { id: BranchId; name: string }[] = [
  { id: 'branch-001', name: 'Main Branch' },
  { id: 'branch-002', name: 'North Branch' },
  { id: 'branch-003', name: 'South Branch' },
]

const EMPLOYEES: { id: EmployeeId; name: string }[] = [
  { id: 'emp-001', name: 'Maria Santos' },
  { id: 'emp-002', name: 'Juan Dela Cruz' },
  { id: 'emp-003', name: 'Rosa Garcia' },
]

const PRODUCTS: Product[] = [
  {
    id: 'p-001',
    name: 'Mobil 1 Engine Oil 1L',
    sku: 'MOB-1L-001',
    stocks: [
      { branchId: 'branch-001', employeeId: 'emp-001', stock: 14 },
      { branchId: 'branch-001', employeeId: 'emp-002', stock: 11 },
      { branchId: 'branch-001', employeeId: 'emp-003', stock: 9 },
      { branchId: 'branch-002', employeeId: 'emp-001', stock: 7 },
      { branchId: 'branch-002', employeeId: 'emp-002', stock: 5 },
      { branchId: 'branch-002', employeeId: 'emp-003', stock: 8 },
      { branchId: 'branch-003', employeeId: 'emp-001', stock: 3 },
      { branchId: 'branch-003', employeeId: 'emp-002', stock: 6 },
      { branchId: 'branch-003', employeeId: 'emp-003', stock: 4 },
    ],
  },
  {
    id: 'p-002',
    name: 'Castrol GTX 5W-30',
    sku: 'CAS-5W30-002',
    stocks: [
      { branchId: 'branch-001', employeeId: 'emp-001', stock: 22 },
      { branchId: 'branch-001', employeeId: 'emp-002', stock: 18 },
      { branchId: 'branch-001', employeeId: 'emp-003', stock: 15 },
      { branchId: 'branch-002', employeeId: 'emp-001', stock: 10 },
      { branchId: 'branch-002', employeeId: 'emp-002', stock: 12 },
      { branchId: 'branch-002', employeeId: 'emp-003', stock: 9 },
      { branchId: 'branch-003', employeeId: 'emp-001', stock: 8 },
      { branchId: 'branch-003', employeeId: 'emp-002', stock: 4 },
      { branchId: 'branch-003', employeeId: 'emp-003', stock: 6 },
    ],
  },
  {
    id: 'p-003',
    name: 'Oil Filter',
    sku: 'OIL-FLT-010',
    stocks: [
      { branchId: 'branch-001', employeeId: 'emp-001', stock: 9 },
      { branchId: 'branch-001', employeeId: 'emp-002', stock: 7 },
      { branchId: 'branch-001', employeeId: 'emp-003', stock: 6 },
      { branchId: 'branch-002', employeeId: 'emp-001', stock: 5 },
      { branchId: 'branch-002', employeeId: 'emp-002', stock: 3 },
      { branchId: 'branch-002', employeeId: 'emp-003', stock: 4 },
      { branchId: 'branch-003', employeeId: 'emp-001', stock: 2 },
      { branchId: 'branch-003', employeeId: 'emp-002', stock: 3 },
      { branchId: 'branch-003', employeeId: 'emp-003', stock: 1 },
    ],
  },
]

function stockKey(productId: string, branchId: BranchId, employeeId: EmployeeId) {
  return `${productId}::${branchId}::${employeeId}`
}

function getStock(product: Product, branchId: BranchId, employeeId: EmployeeId): number {
  return product.stocks.find((s) => s.branchId === branchId && s.employeeId === employeeId)?.stock ?? 0
}

export function Inventory() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>(PRODUCTS)

  // Editable buffer (dummy for now)
  const [draftStocks, setDraftStocks] = useState<Record<string, string>>({})
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(() => new Set())
  const [savingProductId, setSavingProductId] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, query])

  const ensureDraftValue = (p: Product, branchId: BranchId, employeeId: EmployeeId) => {
    const k = stockKey(p.id, branchId, employeeId)
    if (draftStocks[k] !== undefined) return

    const current = getStock(p, branchId, employeeId)
    setDraftStocks((prev) => ({ ...prev, [k]: String(current) }))
  }

  const setDraft = (p: Product, branchId: BranchId, employeeId: EmployeeId, value: string) => {
    const k = stockKey(p.id, branchId, employeeId)
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
    setSavingProductId(p.id)

    const updated: Product = {
      ...p,
      stocks: p.stocks.map((s) => {
        const k = stockKey(p.id, s.branchId, s.employeeId)
        if (!dirtyKeys.has(k)) return s

        const validated = validateStock(draftStocks[k] ?? '')
        if (validated === null) return s
        return { ...s, stock: validated }
      }),
    }

    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)))

    // Clear dirty/drafts for that product
    setDirtyKeys((prev) => {
      const next = new Set(prev)
      for (const s of p.stocks) {
        next.delete(stockKey(p.id, s.branchId, s.employeeId))
      }
      return next
    })

    setDraftStocks((prev) => {
      const next = { ...prev }
      for (const s of p.stocks) {
        delete next[stockKey(p.id, s.branchId, s.employeeId)]
      }
      return next
    })

    // Dummy network delay
    await new Promise((r) => setTimeout(r, 350))
    setSavingProductId(null)
  }

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">Inventory</h1>
          <p className="text-base-content/60 text-sm sm:text-base">
Dummy stock editor: update stocks per product by branch and employee (no API integration yet).
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

        <div className="space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body py-10">
                <p className="text-base-content/60">No products match your search.</p>
              </div>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSaving = savingProductId === p.id
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
                          disabled={isSaving || !dirtyKeys.size}
                          onClick={() => saveProduct(p)}
                          title={dirtyKeys.size ? 'Save changes (dummy)' : 'No changes'}
                        >
                          {isSaving ? 'Saving...' : 'Save stock'}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="table table-zebra text-sm">
                        <thead>
                          <tr>
                            <th className="w-64">Employee</th>
                            {BRANCHES.map((b) => (
                              <th key={b.id} className="text-center">
                                {b.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {EMPLOYEES.map((e) => (
                            <tr key={e.id}>
                              <td className="font-medium">{e.name}</td>
                              {BRANCHES.map((b) => {
                                const k = stockKey(p.id, b.id, e.id)
                                const isDirty = dirtyKeys.has(k)

                                const value =
                                  draftStocks[k] !== undefined
                                    ? draftStocks[k]
                                    : String(getStock(p, b.id, e.id))

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
                                        onFocus={() => ensureDraftValue(p, b.id, e.id)}
                                        onChange={(ev) => setDraft(p, b.id, e.id, ev.target.value)}
                                      />
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

