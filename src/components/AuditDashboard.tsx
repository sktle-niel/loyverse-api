// Main audit dashboard component
import { useState } from 'react'
import { AuditFilters } from './AuditFilters'
import { AuditTable, type AuditRecord } from './AuditTable'
import { useAuditFilters } from '../hooks/useAuditFilters'


// Mock data - replace with real API call later
const MOCK_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: '1',
    itemName: 'Mobil 1 Engine Oil 1L',
    adminName: 'Maria Santos',
    newStock: 45,
    changeAmount: -5,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    itemName: 'Spark Plugs (Set of 4)',
    adminName: 'Juan Dela Cruz',
    newStock: 108,
    changeAmount: 8,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    itemName: 'Oil Filter',
    adminName: 'Maria Santos',
    newStock: 195,
    changeAmount: -5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    itemName: 'Castrol GTX 5W-30',
    adminName: 'Rosa Garcia',
    newStock: 40,
    changeAmount: -5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5',
    itemName: 'Battery 12V',
    adminName: 'Juan Dela Cruz',
    newStock: 82,
    changeAmount: 7,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '6',
    itemName: 'Brake Pads',
    adminName: 'Maria Santos',
    newStock: 25,
    changeAmount: -5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: '7',
    itemName: 'Shell Helix Ultra 4L',
    adminName: 'Rosa Garcia',
    newStock: 68,
    changeAmount: 8,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: '8',
    itemName: 'Air Filter',
    adminName: 'Juan Dela Cruz',
    newStock: 38,
    changeAmount: -2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
]

export function AuditDashboard() {
  const [auditRecords] = useState<AuditRecord[]>(MOCK_AUDIT_RECORDS)
  const [isLoading] = useState(false)

  const {
    filteredRecords,
    searchTerm,
    onSearchChange,
    branchId,
    onBranchChange,
    direction,
    onDirectionChange,
    branches,
    onClearFilters,
  } = useAuditFilters(auditRecords)



  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            Audit Trail
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">
            Monitor stock changes made by admins
          </p>
        </div>

        {/* Filters */}
        <AuditFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          branchId={branchId}
          onBranchChange={onBranchChange}
          direction={direction}
          onDirectionChange={onDirectionChange}
          onClearFilters={onClearFilters}
          branches={branches}
        />



        {/* Audit Table */}
        <AuditTable records={filteredRecords} isLoading={isLoading} />
      </div>
    </div>
  )
}
