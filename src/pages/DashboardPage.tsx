import { useState } from 'react'
import { FleetMap } from '@/components/map/FleetMap'
import { FleetStatsRow, AttentionBanner } from '@/components/dashboard/FleetStatsRow'
import { VehicleListPanel } from '@/components/dashboard/VehicleListPanel'
import { AlertsFeed } from '@/components/dashboard/AlertsFeed'
import { Skeleton } from '@/components/ui/Skeleton'
import { useVehicles } from '@/hooks/useVehicles'
import { useGeofences } from '@/hooks/useGeofences'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { VehicleStatus } from '@/types/database'

export default function DashboardPage() {
  usePageTitle('Fleet Dashboard', 'Live overview of every vehicle in operation')

  const { data: vehicles, isLoading } = useVehicles()
  const { data: geofences } = useGeofences()
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined)

  const attentionCount =
    vehicles?.filter((v) => v.highest_open_severity === 'critical').length ?? 0

  if (isLoading || !vehicles) {
    return (
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-[520px]" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <AttentionBanner count={attentionCount} />
      <FleetStatsRow
        vehicles={vehicles}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px_300px]">
        <FleetMap
          vehicles={vehicles}
          geofences={geofences}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={setSelectedVehicleId}
          className="min-h-[420px] lg:min-h-0"
        />
        <VehicleListPanel
          vehicles={vehicles}
          statusFilter={statusFilter}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={setSelectedVehicleId}
        />
        <AlertsFeed />
      </div>
    </div>
  )
}
