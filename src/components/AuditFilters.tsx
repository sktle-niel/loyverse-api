// Audit trail filter component
interface AuditFiltersProps {
  searchTerm: string
  selectedItem: string
  dateFrom: string
  dateTo: string
  onSearchChange: (search: string) => void
  onItemChange: (item: string) => void
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearFilters: () => void
  items: string[]
}

export function AuditFilters({
  searchTerm,
  selectedItem,
  dateFrom,
  dateTo,
  onSearchChange,
  onItemChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  items,
}: AuditFiltersProps) {
  return (
    <div className="card bg-base-100 shadow border border-base-200 mb-6">
      <div className="card-body">
        <h3 className="card-title text-base sm:text-lg text-base-content mb-4">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search Filter */}
          <div className="form-control">
            <label className="label py-2 sm:py-3">
              <span className="label-text font-semibold text-base-content text-xs sm:text-sm">
                Search
              </span>
            </label>
            <input
              type="text"
              placeholder="Item or admin name..."
              className="input input-bordered w-full focus:input-primary text-sm"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Item Filter */}
          <div className="form-control">
            <label className="label py-2 sm:py-3">
              <span className="label-text font-semibold text-base-content text-xs sm:text-sm">
                Item
              </span>
            </label>
            <select
              className="select select-bordered w-full focus:select-primary text-sm"
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
            <label className="label py-2 sm:py-3">
              <span className="label-text font-semibold text-base-content text-xs sm:text-sm">
                From
              </span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full focus:input-primary text-sm"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>

          {/* Date To Filter */}
          <div className="form-control">
            <label className="label py-2 sm:py-3">
              <span className="label-text font-semibold text-base-content text-xs sm:text-sm">
                To
              </span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full focus:input-primary text-sm"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-outline btn-sm text-xs sm:text-sm"
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}
