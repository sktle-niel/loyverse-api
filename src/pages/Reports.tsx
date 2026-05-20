// Reports page with analytics and statistics
import { MOCK_AUDIT_RECORDS } from './Dashboard'

export function Reports() {
  // Calculate statistics
  const totalChanges = MOCK_AUDIT_RECORDS.length

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

  // Unique admins
  const uniqueAdmins = new Set(MOCK_AUDIT_RECORDS.map((r) => r.adminName))
  const adminCount = uniqueAdmins.size

  // Most changed items
  const itemChanges = new Map<string, number>()
  MOCK_AUDIT_RECORDS.forEach((record) => {
    const current = itemChanges.get(record.itemName) || 0
    itemChanges.set(record.itemName, current + 1)
  })
  const topItems = Array.from(itemChanges.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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

        {/* Inventory Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Out of Stock */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">Out of Stock</p>
                  <p className="text-2xl sm:text-3xl font-bold text-error mt-2">
                    {outOfStock.length}
                  </p>
                </div>
                <div className="text-3xl">❌</div>
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">Low Stock</p>
                  <p className="text-2xl sm:text-3xl font-bold text-warning mt-2">
                    {lowStock.length}
                  </p>
                </div>
                <div className="text-3xl">⚠️</div>
              </div>
            </div>
          </div>

          {/* In Stock */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">In Stock</p>
                  <p className="text-2xl sm:text-3xl font-bold text-success mt-2">
                    {inStock.length}
                  </p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Out of Stock Items */}
          <div className="card bg-base-100 shadow border border-error/20">
            <div className="card-body">
              <h2 className="card-title text-lg text-error mb-4">
                ❌ Out of Stock (0)
              </h2>
              {outOfStock.length === 0 ? (
                <p className="text-base-content/60 text-sm">No items out of stock</p>
              ) : (
                <div className="space-y-2">
                  {outOfStock.map(([item, stock]) => (
                    <div key={item} className="flex justify-between items-center p-2 bg-base-200/30 rounded">
                      <span className="text-sm text-base-content truncate">{item}</span>
                      <span className="text-xs font-bold text-error">{stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="card bg-base-100 shadow border border-warning/20">
            <div className="card-body">
              <h2 className="card-title text-lg text-warning mb-4">
                ⚠️ Low Stock (1-3)
              </h2>
              {lowStock.length === 0 ? (
                <p className="text-base-content/60 text-sm">No low stock items</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.map(([item, stock]) => (
                    <div key={item} className="flex justify-between items-center p-2 bg-base-200/30 rounded">
                      <span className="text-sm text-base-content truncate">{item}</span>
                      <span className="text-xs font-bold text-warning">{stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* In Stock Items */}
          <div className="card bg-base-100 shadow border border-success/20">
            <div className="card-body">
              <h2 className="card-title text-lg text-success mb-4">
                ✅ In Stock (4+)
              </h2>
              {inStock.length === 0 ? (
                <p className="text-base-content/60 text-sm">No items in stock</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inStock.map(([item, stock]) => (
                    <div key={item} className="flex justify-between items-center p-2 bg-base-200/30 rounded">
                      <span className="text-sm text-base-content truncate">{item}</span>
                      <span className="text-xs font-bold text-success">{stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Most Changed Items */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg sm:text-xl text-base-content mb-4">
              📊 Top Changed Items
            </h2>
            <div className="space-y-3">
              {topItems.map(([item, count]) => (
                <div key={item} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base text-base-content font-medium truncate">
                      {item}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / topItems[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-primary min-w-[2rem] text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
