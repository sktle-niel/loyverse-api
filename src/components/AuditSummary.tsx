// Summary statistics for audit trail
interface AuditSummaryProps {
  totalChanges: number
  todayChanges: number
  adminCount: number
}

export function AuditSummary({
  totalChanges,
  todayChanges,
  adminCount,
}: AuditSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="stat bg-base-100 shadow border border-base-200 rounded-lg">
        <div className="stat-figure text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
          </svg>
        </div>
        <div className="stat-title text-base-content/60">Total Changes</div>
        <div className="stat-value text-primary">{totalChanges}</div>
      </div>

      <div className="stat bg-base-100 shadow border border-base-200 rounded-lg">
        <div className="stat-figure text-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <div className="stat-title text-base-content/60">Today's Changes</div>
        <div className="stat-value text-info">{todayChanges}</div>
      </div>

      <div className="stat bg-base-100 shadow border border-base-200 rounded-lg">
        <div className="stat-figure text-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6-9h.01M15 20H9a6 6 0 0112 0v1H9a6 6 0 00-6-6v1"
            ></path>
          </svg>
        </div>
        <div className="stat-title text-base-content/60">Active Admins</div>
        <div className="stat-value text-success">{adminCount}</div>
      </div>
    </div>
  )
}
