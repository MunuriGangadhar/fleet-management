import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Fuel, BatteryMedium, Gauge, Route, Power } from 'lucide-react'
import { useVehicle } from '@/hooks/useVehicles'
import { useTripsForVehicle } from '@/hooks/useTrips'
import { useMaintenanceForVehicle } from '@/hooks/useMaintenance'
import { useAlerts } from '@/hooks/useAlerts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { FleetMap } from '@/components/map/FleetMap'
import { MetricCard } from '@/components/vehicle/MetricCard'
import { TripHistoryList } from '@/components/vehicle/TripHistoryList'
import { MaintenancePanel } from '@/components/vehicle/MaintenancePanel'
import { AlertsFeed } from '@/components/dashboard/AlertsFeed'
import { HealthGauge } from '@/components/ui/HealthGauge'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { computeHealthScore } from '@/lib/healthScore'
import { ALERT_SEVERITY_ORDER, VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL, VEHICLE_TYPE_LABEL } from '@/lib/constants'
import { formatOdometer, formatRelativeTime, formatSpeed } from '@/lib/utils'
import type { VehicleWithRelations } from '@/types/domain'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: vehicle, isLoading } = useVehicle(id)
  const { data: trips } = useTripsForVehicle(id)
  const { data: maintenanceLogs } = useMaintenanceForVehicle(id)
  const { data: vehicleAlerts } = useAlerts({ vehicleId: id })

  usePageTitle(
    vehicle ? vehicle.registration_number : 'Vehicle',
    vehicle ? `${vehicle.make} ${vehicle.model} · ${VEHICLE_TYPE_LABEL[vehicle.vehicle_type]}` : undefined,
  )

  if (isLoading || !vehicle) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const maintenanceStatus =
    maintenanceLogs?.find((l) => l.status === 'overdue')?.status ??
    maintenanceLogs?.find((l) => l.status === 'due_soon')?.status ??
    null

  const openAlertCount = vehicleAlerts?.length ?? 0
  const highestOpenSeverity =
    vehicleAlerts?.reduce<(typeof vehicleAlerts)[number]['severity'] | null>((acc, a) => {
      if (!acc) return a.severity
      return ALERT_SEVERITY_ORDER[a.severity] > ALERT_SEVERITY_ORDER[acc] ? a.severity : acc
    }, null) ?? null

  const health = computeHealthScore(
    vehicle,
    { count: openAlertCount, highestSeverity: highestOpenSeverity },
    maintenanceStatus,
  )
  const mapVehicle: VehicleWithRelations = {
    ...vehicle,
    open_alert_count: openAlertCount,
    highest_open_severity: highestOpenSeverity,
  }

  return (
    <div className="space-y-4 p-5">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={13} /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center gap-4">
          <HealthGauge breakdown={health} size={56} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {vehicle.registration_number}
              </h2>
              <Badge color={VEHICLE_STATUS_COLOR[vehicle.status]}>
                {VEHICLE_STATUS_LABEL[vehicle.status]}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {vehicle.name} · {vehicle.driver ? vehicle.driver.name : 'Unassigned driver'}
            </p>
          </div>
        </div>
        {health.factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {health.factors.map((f) => (
              <span
                key={f}
                className="rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Fuel level"
          value={vehicle.fuel_level !== null ? `${Math.round(vehicle.fuel_level)}%` : 'N/A'}
          icon={<Fuel size={14} />}
        />
        <MetricCard
          label="Battery"
          value={vehicle.battery_level !== null ? `${Math.round(vehicle.battery_level)}%` : 'N/A'}
          icon={<BatteryMedium size={14} />}
        />
        <MetricCard label="Odometer" value={formatOdometer(vehicle.odometer_km)} icon={<Route size={14} />} />
        <MetricCard
          label="Current speed"
          value={formatSpeed(vehicle.last_speed_kmh ?? 0)}
          icon={<Gauge size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FleetMap vehicles={[mapVehicle]} className="h-[360px]" />
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm">
            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                <Power size={13} /> Ignition
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {vehicle.ignition_state ? 'On' : 'Off'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] py-1.5">
              <span className="text-[var(--text-tertiary)]">Last seen</span>
              <span className="font-medium text-[var(--text-primary)]">
                {formatRelativeTime(vehicle.last_seen_at)}
              </span>
            </div>
          </div>
          <AlertsFeed vehicleId={vehicle.id} showViewAll={false} limit={4} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TripHistoryList trips={trips ?? []} vehicleRegistration={vehicle.registration_number} />
        <MaintenancePanel logs={maintenanceLogs ?? []} />
      </div>
    </div>
  )
}
