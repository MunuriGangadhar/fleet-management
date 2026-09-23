import { Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { buildVehicleIcon } from './vehicleIcon'
import { HealthGauge } from '@/components/ui/HealthGauge'
import { Badge } from '@/components/ui/Badge'
import { computeHealthScore } from '@/lib/healthScore'
import { useAnimatedLatLng } from '@/hooks/useAnimatedLatLng'
import { VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL } from '@/lib/constants'
import { formatRelativeTime, formatSpeed } from '@/lib/utils'
import type { VehicleWithRelations } from '@/types/domain'

export function VehicleMapMarker({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: VehicleWithRelations
  selected: boolean
  onSelect?: (id: string) => void
}) {
  const animated = useAnimatedLatLng(vehicle.last_lat as number, vehicle.last_lng as number)

  return (
    <Marker
      position={[animated.lat, animated.lng]}
      icon={buildVehicleIcon(vehicle.status, vehicle.last_heading ?? 0, selected)}
      eventHandlers={{ click: () => onSelect?.(vehicle.id) }}
    >
      <Popup minWidth={220}>
        <VehiclePopupContent vehicle={vehicle} />
      </Popup>
    </Marker>
  )
}

function VehiclePopupContent({ vehicle }: { vehicle: VehicleWithRelations }) {
  const health = computeHealthScore(
    vehicle,
    { count: vehicle.open_alert_count, highestSeverity: vehicle.highest_open_severity },
    null,
  )
  return (
    <div className="min-w-[180px] space-y-2 text-[var(--text-primary)]">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{vehicle.registration_number}</p>
        <Badge color={VEHICLE_STATUS_COLOR[vehicle.status]}>
          {VEHICLE_STATUS_LABEL[vehicle.status]}
        </Badge>
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">{vehicle.name}</p>
      <div className="flex items-center justify-between text-xs">
        <span>Speed: {formatSpeed(vehicle.last_speed_kmh ?? 0)}</span>
        <span>{formatRelativeTime(vehicle.last_seen_at)}</span>
      </div>
      <HealthGauge breakdown={health} size={32} showLabel={false} />
      <Link
        to={`/vehicles/${vehicle.id}`}
        className="block rounded-md bg-[var(--accent)] px-2.5 py-1.5 text-center text-xs font-medium text-white"
      >
        View details
      </Link>
    </div>
  )
}
