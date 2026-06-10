import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CreateItemBody } from '../api/types'
import { useCreateItem } from '../hooks/useCreateItem'
import { useStores } from '../hooks/useStores'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../constants/app'

const COLORS: { value: string; className: string }[] = [
  { value: 'GREY', className: 'bg-gray-400' },
  { value: 'RED', className: 'bg-red-500' },
  { value: 'PINK', className: 'bg-pink-500' },
  { value: 'ORANGE', className: 'bg-orange-500' },
  { value: 'YELLOW', className: 'bg-lime-400' },
  { value: 'GREEN', className: 'bg-green-500' },
  { value: 'BLUE', className: 'bg-blue-500' },
  { value: 'PURPLE', className: 'bg-purple-500' },
]

const SHAPES: { value: string; radius: string }[] = [
  { value: 'SQUARE', radius: 'rounded-md' },
  { value: 'CIRCLE', radius: 'rounded-full' },
  { value: 'SCALLOPED', radius: 'rounded-2xl' },
  { value: 'HEXAGON', radius: 'rounded-lg rotate-12' },
]

const PRICE_RE = /^\d+(\.\d{1,2})?$/

type StoreRow = { available: boolean; price: string }

export function AddItem() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { stores, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useStores()
  const { categories, categoriesLoading, createItem } = useCreateItem()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [soldByWeight, setSoldByWeight] = useState(false)
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [trackStock, setTrackStock] = useState(false)
  const [allStores, setAllStores] = useState(true)
  const [storeRows, setStoreRows] = useState<Record<string, StoreRow>>({})
  const [color, setColor] = useState('GREY')
  const [shape, setShape] = useState('SQUARE')
  const [saving, setSaving] = useState(false)

  // Seed store rows once stores load (available by default, like Loyverse).
  useEffect(() => {
    if (stores.length === 0) return
    setStoreRows((prev) => {
      const next = { ...prev }
      for (const s of stores) if (!next[s.id]) next[s.id] = { available: true, price: '' }
      return next
    })
  }, [stores])

  const allChecked = useMemo(
    () => stores.length > 0 && stores.every((s) => storeRows[s.id]?.available),
    [stores, storeRows],
  )

  const toggleAllStores = (checked: boolean) => {
    setAllStores(checked)
    setStoreRows((prev) => {
      const next = { ...prev }
      for (const s of stores) next[s.id] = { ...(next[s.id] ?? { price: '' }), available: checked }
      return next
    })
  }

  const setStoreField = (storeId: string, field: keyof StoreRow, value: boolean | string) => {
    setStoreRows((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] ?? { available: true, price: '' }), [field]: value },
    }))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast({ message: 'Item name is required.', durationMs: 4000 })
      return
    }
    // Validate numeric fields
    const numericFields: [string, string][] = [['Cost', cost], ['Price', price]]
    for (const [label, v] of numericFields) {
      if (v.trim() && !PRICE_RE.test(v.trim())) {
        showToast({ message: `${label} must be a valid amount (e.g. 160 or 160.50).`, durationMs: 4000 })
        return
      }
    }
    for (const s of stores) {
      const p = storeRows[s.id]?.price ?? ''
      if (p.trim() && !PRICE_RE.test(p.trim())) {
        showToast({ message: `Price for ${s.name} must be a valid amount.`, durationMs: 4000 })
        return
      }
    }

    const body: CreateItemBody = {
      name: name.trim(),
      categoryId: categoryId || null,
      description: description.trim() || undefined,
      soldByWeight,
      trackStock,
      cost: cost.trim() ? Number(cost) : 0,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      defaultPrice: price.trim() ? Number(price) : null,
      color,
      form: shape,
      stores: stores.map((s) => ({
        storeId: s.id,
        available: storeRows[s.id]?.available ?? true,
        price: storeRows[s.id]?.price?.trim() ? Number(storeRows[s.id].price) : null,
      })),
    }

    setSaving(true)
    try {
      const res = await createItem(body)
      showToast({ message: `"${res.itemName}" created in Loyverse.`, durationMs: 6000 })
      navigate(ROUTES.PRICE_LIST)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Create failed'
      showToast({ message: `Failed to create item. ${msg}`, durationMs: 7000 })
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-base-content/12 bg-base-100 px-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150'
  const labelClass = 'block text-xs font-medium text-base-content/45 mb-1.5'
  const cardClass = 'rounded-xl border border-base-content/8 bg-base-100 p-5 sm:p-6'

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Add item</h1>
          <p className="text-sm text-base-content/45 mt-1">Create a new product — saved directly to Loyverse.</p>
        </header>

        <div className="space-y-5">
          {/* Item details */}
          <section className={cardClass}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-1">
                <label className={labelClass}>Name <span className="text-error">*</span></label>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass}>Category</label>
                <select className={`${inputClass} appearance-none`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={categoriesLoading}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} min-h-[72px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>

            <div className="mt-4">
              <label className={labelClass}>Sold by</label>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-base-content/80">
                  <input type="radio" className="radio radio-sm radio-primary" checked={!soldByWeight} onChange={() => setSoldByWeight(false)} />
                  Each
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-base-content/80">
                  <input type="radio" className="radio radio-sm radio-primary" checked={soldByWeight} onChange={() => setSoldByWeight(true)} />
                  Weight / Volume
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>Price</label>
                <input className={inputClass} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Leave blank for price upon sale" />
                <p className="text-[11px] text-base-content/35 mt-1">Default selling price. Per-store prices below override this.</p>
              </div>
              <div>
                <label className={labelClass}>Cost</label>
                <input className={inputClass} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>SKU</label>
                <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generated if blank" />
              </div>
              <div>
                <label className={labelClass}>Barcode</label>
                <input className={inputClass} value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-base-content mb-4">Inventory</h2>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm text-base-content/80">Track stock</span>
              <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} />
            </label>
          </section>

          {/* Stores */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-base-content mb-4">Stores</h2>
            <label className="flex items-center gap-2.5 cursor-pointer mb-3">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={allStores && allChecked} onChange={(e) => toggleAllStores(e.target.checked)} />
              <span className="text-sm text-base-content/80">Available for sale in all stores</span>
            </label>

            {storesLoading ? (
              <p className="text-xs text-base-content/40 flex items-center gap-1.5">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
                Loading stores…
              </p>
            ) : storesError || stores.length === 0 ? (
              <div className="rounded-lg border border-base-content/10 bg-base-content/3 px-4 py-4 text-center">
                <p className="text-xs text-base-content/55">{storesError ? `Couldn't load stores. ${storesError}` : 'No stores found.'}</p>
                <button
                  type="button"
                  onClick={() => void refetchStores()}
                  className="btn btn-xs btn-ghost mt-2 text-primary border border-primary/25 hover:bg-primary/10"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-base-content/8 divide-y divide-base-content/6 overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_8rem] items-center gap-3 px-3 py-2 bg-base-content/3 text-[11px] font-medium text-base-content/45 uppercase tracking-wide">
                  <span>Avail.</span><span>Store</span><span className="text-right">Price</span>
                </div>
                {stores.map((s) => {
                  const row = storeRows[s.id] ?? { available: true, price: '' }
                  return (
                    <div key={s.id} className="grid grid-cols-[auto_1fr_8rem] items-center gap-3 px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={row.available}
                        onChange={(e) => setStoreField(s.id, 'available', e.target.checked)}
                      />
                      <span className="text-sm text-base-content/80 break-words">{s.name}</span>
                      <input
                        inputMode="decimal"
                        className="rounded-md border border-base-content/12 bg-base-100 px-2.5 py-1.5 text-sm text-right tabular outline-none focus:border-primary/60"
                        placeholder="—"
                        value={row.price}
                        onChange={(e) => setStoreField(s.id, 'price', e.target.value)}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Representation on POS */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-base-content mb-4">Representation on POS</h2>
            <label className={labelClass}>Color</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-9 h-9 rounded-lg ${c.className} flex items-center justify-center transition-transform ${color === c.value ? 'ring-2 ring-offset-2 ring-base-content/40 ring-offset-base-100 scale-105' : 'hover:scale-105'}`}
                  aria-label={c.value}
                >
                  {color === c.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <label className={labelClass}>Shape</label>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((sh) => (
                <button
                  key={sh.value}
                  type="button"
                  onClick={() => setShape(sh.value)}
                  className={`w-9 h-9 flex items-center justify-center border-2 transition-colors ${sh.radius} ${shape === sh.value ? 'border-primary text-primary' : 'border-base-content/20 text-base-content/30 hover:border-base-content/40'}`}
                  aria-label={sh.value}
                  title={sh.value}
                >
                  {shape === sh.value && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={sh.value === 'HEXAGON' ? '-rotate-12' : ''}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-4">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content border border-base-content/10"
              disabled={saving}
              onClick={() => navigate(ROUTES.PRICE_LIST)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm min-w-[7rem]"
              disabled={saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
              ) : 'Save item'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
