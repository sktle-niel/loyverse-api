import type { ExportItemsResponse } from '../api/types'

/** Column width (in characters) that fits the header and the longest value, clamped to [min, max]. */
function fitWidth(header: string, values: string[], min: number, max: number): number {
  const longest = values.reduce((m, v) => Math.max(m, (v ?? '').length), header.length)
  return Math.min(max, Math.max(min, longest + 2))
}

/**
 * Builds a formatted .xlsx (a real Excel file) for the in-stock items export and downloads it.
 * Columns are auto-sized so nothing is cut off, and it opens cleanly in Excel (no CSV warning).
 * Columns: Handle, SKU, Name, Category, Cost, then In stock [Store] for every branch.
 */
export async function exportItemsToExcel(data: ExportItemsResponse, filename: string): Promise<void> {
  // Lazy-load SheetJS so it's only fetched when the user actually exports (keeps the app bundle small).
  const XLSX = await import('xlsx')

  const storeHeaders = data.stores.map((s) => `In stock [${s.name}]`)
  const headers = ['Handle', 'SKU', 'Name', 'Category', 'Cost', ...storeHeaders]

  const aoa: (string | number)[][] = [headers]
  for (const item of data.items) {
    const stockByStore = new Map(item.stocks.map((s) => [s.storeId, s.inStock]))
    aoa.push([
      item.handle,
      item.sku,
      item.name,
      item.category,
      item.cost ?? '',
      ...data.stores.map((s) => stockByStore.get(s.id) ?? 0),
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Auto-fit column widths from content (capped so very long names stay reasonable).
  ws['!cols'] = [
    { wch: fitWidth('Handle', data.items.map((i) => i.handle), 14, 42) },
    { wch: fitWidth('SKU', data.items.map((i) => i.sku), 8, 16) },
    { wch: fitWidth('Name', data.items.map((i) => i.name), 24, 60) },
    { wch: fitWidth('Category', data.items.map((i) => i.category), 12, 28) },
    { wch: 10 }, // Cost
    ...storeHeaders.map((h) => ({ wch: Math.max(14, h.length + 1) })),
  ]

  // Show Cost with two decimals.
  for (let r = 1; r <= data.items.length; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 4 })]
    if (cell && typeof cell.v === 'number') cell.z = '0.00'
  }

  // Filter dropdowns on the header row.
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }),
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'In stock')
  XLSX.writeFile(wb, filename)
}
