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
  refreshToken: string
  user: AuthUser
}

export type AuditSource = 'loyverse' | 'mock' | 'mysql'

export interface AuditRecord {
  id: string
  itemName: string
  adminName: string
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

export interface ProductStoreStock {
  storeId: string
  storeName: string
  stock: number
}

export interface StockLevelProduct {
  id: string
  variantId: string
  name: string
  sku: string
  stocks: ProductStoreStock[]
}

export interface SyncProgress {
  percent: number          // 0–99 while syncing
  recordsFetched: number
  totalExpected: number
  etaSeconds: number | null
}

export interface StockLevelsResponse {
  products: StockLevelProduct[]
  stores: StoreInfo[]
  total: number
  filtered: number
  source: 'loyverse' | 'mock'
  cachedAt: string
  isLoadingInBackground?: boolean
  syncProgress?: SyncProgress | null
}

export type TransferRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface TransferRequest {
  id: string
  itemId: string
  variantId: string
  itemName: string
  sku: string
  fromStoreId: string
  fromStoreName: string
  toStoreId: string
  toStoreName: string
  quantity: number
  fromStockCurrent?: number | null
  toStockCurrent?: number | null
  requestedBy: string
  status: TransferRequestStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

export interface TransferRequestsResponse {
  requests: TransferRequest[]
  total: number
}

export interface PendingTransferStock {
  variantId: string
  storeId: string
  stock: number
}

export interface PendingTransferStocksResponse {
  stocks: PendingTransferStock[]
}

export interface StockUpdateInput {
  storeId: string
  stock: number
}

export interface SubmitStockRequestBody {
  /** Preferred: one branch per request */
  storeId?: string
  stock?: number
  /** Legacy */
  updates?: StockUpdateInput[]
  requestedBy?: string
}

export interface SubmitStockRequestResponse {
  request: StockChangeRequest
  message: string
}

export interface StockRequestLine {
  storeId: string
  storeName: string
  newStock: number
}

export type StockRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface StockChangeRequest {
  id: string
  itemId: string
  variantId: string
  itemName: string
  sku: string
  storeId: string
  storeName: string
  changeAmount: number
  newStock: number
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
