// Audit trail filter component
interface AuditFiltersProps {
  selectedAdmin: string
  selectedItem: string
  dateFrom: string
  dateTo: string
  onAdminChange: (admin: string) => void
  onItemChange: (item: string) => void
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearFilters: () => void
  admins: string[]
  items: string[]
}

export function AuditFilters({
  selectedAdmin,
  selectedItem,
  dateFrom,
  dateTo,
  onAdminChange,
  onItemChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  admins,
  items,
}: AuditFiltersProps) {
  return (
    <div className="card bg-base-100 shadow border border-base-200 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg text-base-content mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Admin Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content">
                Admin
              </span>
            </label>
            <select
              className="select select-bordered w-full focus:select-primary"
              value={selectedAdmin}
              onChange={(e) => onAdminChange(e.target.value)}
            >
              <option value="">All Admins</option>
              {admins.map((admin) => (
                <option key={admin} value={admin}>
                  {admin}
                </option>
              ))}
            </select>
          </div>

          {/* Item Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content">
                Item
              </span>
            </label>
            <select
              className="select select-bordered w-full focus:select-primary"
              value={selectedItem}
              onChange={(e) => onItemChange(e.target.value)}
            >
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content">
                From
              </span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full focus:input-primary"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>

          {/* Date To Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content">
                To
              </span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full focus:input-primary"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-outline btn-sm"
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}
