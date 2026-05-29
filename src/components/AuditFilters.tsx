export type AuditDirectionFilter = 'all' | 'decrease' | 'increase'
export type AuditBranchFilter = string

interface AuditFiltersProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  branchId: AuditBranchFilter
  onBranchChange: (branchId: AuditBranchFilter) => void
  direction: AuditDirectionFilter
  onDirectionChange: (direction: AuditDirectionFilter) => void
  onClearFilters: () => void
  branches: { id: string; name: string }[]
}

export function AuditFilters({
  searchTerm,
  onSearchChange,
  branchId,
  onBranchChange,
  direction,
  onDirectionChange,
  onClearFilters,
  branches,
}: AuditFiltersProps) {
  const hasActiveFilters = searchTerm || branchId || direction !== 'all'

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 basis-40">
          <label className="text-xs font-medium text-base-content/50">Search</label>
          <input
            type="text"
            placeholder="Item or admin name…"
            className="input input-sm input-bordered bg-base-100 text-sm w-full"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Branch */}
        <div className="flex flex-col gap-1.5 min-w-0 w-44">
          <label className="text-xs font-medium text-base-content/50">Branch</label>
          <select
            className="select select-sm select-bordered bg-base-100 text-sm w-full"
            value={branchId}
            onChange={(e) => onBranchChange(e.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Movement */}
        <div className="flex flex-col gap-1.5 min-w-0 w-40">
          <label className="text-xs font-medium text-base-content/50">Movement</label>
          <select
            className="select select-sm select-bordered bg-base-100 text-sm w-full"
            value={direction}
            onChange={(e) => onDirectionChange(e.target.value as AuditDirectionFilter)}
          >
            <option value="all">All movements</option>
            <option value="decrease">Decreased</option>
            <option value="increase">Increased</option>
          </select>
        </div>

        {/* Clear */}
        {hasActiveFilters ? (
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content self-end"
            onClick={onClearFilters}
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}
