// Audit trail filter component
interface AuditFiltersProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  onClearFilters: () => void
}


export function AuditFilters({
  searchTerm,
  onSearchChange,
  onClearFilters,
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

          {/* Search Only */}

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
