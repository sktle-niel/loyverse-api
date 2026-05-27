export type UserRole = 'admin' | 'operator'

export interface AuthUser {
  id: string
  username: string
  email: string
  displayName: string
  role: UserRole
}

export interface PublicUser {
  id: string
  username: string
  email: string
  displayName: string
  role: UserRole
  createdAt: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export type AuditSource = 'loyverse' | 'mock' | 'mysql'

export interface AuditRecord {
  id: string
  itemName: string
  adminName: string
  oldStock: number
  newStock: number
  changeAmount: number
  timestamp: string
  branchId?: string
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

export interface StoreInfo {
  id: string
  name: string
}

export interface ProductStockCell {
  storeId: string
  stock: number
}

export interface Product {
  id: string
  variantId: string
  name: string
  sku: string
  stocks: ProductStockCell[]
}

export interface ProductsResponse {
  products: Product[]
  stores: StoreInfo[]
  total: number
  source: 'loyverse' | 'mock'
  catalogNote?: string
  catalogTotal?: number
  cachedAt?: string
}

export interface StockUpdateInput {
  storeId: string
  stock: number
}

export interface SubmitStockRequestBody {
  updates: StockUpdateInput[]
  requestedBy?: string
}

export interface SubmitStockRequestResponse {
  request: StockChangeRequest
  message: string
}

export interface StockRequestLine {
  storeId: string
  storeName: string
  oldStock: number
  newStock: number
}

export type StockRequestStatus = 'pending' | 'approved' | 'rejected'

export interface StockChangeRequest {
  id: string
  itemId: string
  variantId: string
  itemName: string
  sku: string
  requestedBy: string
  status: StockRequestStatus
  lines: StockRequestLine[]
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

export interface StockRequestsResponse {
  requests: StockChangeRequest[]
  total: number
  storage?: 'mysql' | 'memory'
}

export interface ApproveStockRequestResponse {
  request: StockChangeRequest
  message: string
  source: 'loyverse' | 'mock'
}
