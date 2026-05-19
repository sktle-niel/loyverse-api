// Reports page with analytics and statistics
import { MOCK_AUDIT_RECORDS } from './Dashboard'

export function Reports() {
  // Calculate statistics
  const totalChanges = MOCK_AUDIT_RECORDS.length
  const today = new Date().toDateString()
  const todayChanges = MOCK_AUDIT_RECORDS.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  ).length

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

  // Most active admins
  const adminChanges = new Map<string, number>()
  MOCK_AUDIT_RECORDS.forEach((record) => {
    const current = adminChanges.get(record.adminName) || 0
    adminChanges.set(record.adminName, current + 1)
  })
  const topAdmins = Array.from(adminChanges.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Stock changes (gains vs losses)
  let totalIncreases = 0
  let totalDecreases = 0
  MOCK_AUDIT_RECORDS.forEach((record) => {
    if (record.changeAmount > 0) {
      totalIncreases += record.changeAmount
    } else {
      totalDecreases += Math.abs(record.changeAmount)
    }
  })

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            Reports
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">
            Audit trail analytics and statistics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Total Changes */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">Total Changes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary mt-2">
                    {totalChanges}
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
          </div>

          {/* Today's Changes */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">Today's Changes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-info mt-2">
                    {todayChanges}
                  </p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
            </div>
          </div>

          {/* Active Admins */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">Active Admins</p>
                  <p className="text-2xl sm:text-3xl font-bold text-success mt-2">
                    {adminCount}
                  </p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
          </div>

          {/* Stock Increases */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-xs sm:text-sm font-medium">Stock Increases</p>
                  <p className="text-2xl sm:text-3xl font-bold text-success mt-2">
                    {totalIncreases}
                  </p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Most Changed Items */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg sm:text-xl text-base-content mb-4">
                Top Changed Items
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

          {/* Most Active Admins */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg sm:text-xl text-base-content mb-4">
                Most Active Admins
              </h2>
              <div className="space-y-3">
                {topAdmins.map(([admin, count]) => (
                  <div key={admin} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base text-base-content font-medium truncate">
                        {admin}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-base-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(count / topAdmins[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-accent min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="card bg-base-100 shadow border border-base-200 mt-4 sm:mt-6">
          <div className="card-body">
            <h2 className="card-title text-lg sm:text-xl text-base-content mb-4">
              Stock Movement Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-base-200/30 rounded-lg border border-base-200">
                <p className="text-xs text-base-content/60 mb-1">Total Increases</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{totalIncreases}</p>
              </div>
              <div className="p-3 sm:p-4 bg-base-200/30 rounded-lg border border-base-200">
                <p className="text-xs text-base-content/60 mb-1">Total Decreases</p>
                <p className="text-xl sm:text-2xl font-bold text-error">{totalDecreases}</p>
              </div>
              <div className="p-3 sm:p-4 bg-base-200/30 rounded-lg border border-base-200">
                <p className="text-xs text-base-content/60 mb-1">Unique Items</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">
                  {itemChanges.size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
