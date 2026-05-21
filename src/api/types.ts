export type AuditSource = 'loyverse' | 'mock'

export interface AuditRecord {
  id: string
  itemName: string
  adminName: string
  oldStock: number
  newStock: number
  changeAmount: number
  timestamp: string
}

export interface AuditResponse {
  records: AuditRecord[]
  total: number
  source: AuditSource
}

export type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock'
export interface InventoryItem {
  itemName: string
  stock: number
  status: InventoryStatus
}

export interface InventorySummary {
  'out-of-stock': number
  'low-stock': number
  'in-stock': number
}

export interface InventoryResponse {
  items: InventoryItem[]
  summary: InventorySummary
  total: number
  source: 'loyverse' | 'mock'
}

