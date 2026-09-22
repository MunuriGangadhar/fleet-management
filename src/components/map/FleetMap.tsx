import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet'
import { VehicleMapMarker } from './VehicleMapMarker'
import { MapLegend } from './MapLegend'
import { DEPOT } from '@/lib/constants'
import type { GeofenceRow } from '@/types/database'
import type { VehicleWithRelations } from '@/types/domain'

const GEOFENCE_COLOR: Record<GeofenceRow['type'], string> = {
  depot: 'var(--info)',
  customer: 'var(--success)',
  restricted: 'var(--danger)',
}

function FlyToVehicle({ vehicle }: { vehicle: VehicleWithRelations | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (vehicle?.last_lat && vehicle?.last_lng) {
      map.flyTo([vehicle.last_lat, vehicle.last_lng], 14, { duration: 0.8 })
    }
  }, [map, vehicle?.id, vehicle?.last_lat, vehicle?.last_lng])
  return null
}

export function FleetMap({
  vehicles,
  geofences = [],
  selectedVehicleId,
  onSelectVehicle,
  className,
  height = '100%',
}: {
  vehicles: VehicleWithRelations[]
  geofences?: GeofenceRow[]
  selectedVehicleId?: string
  onSelectVehicle?: (id: string) => void
  className?: string
  height?: string | number
}) {
  const located = useMemo(() => vehicles.filter((v) => v.last_lat && v.last_lng), [vehicles])
  const selected = located.find((v) => v.id === selectedVehicleId)

  const center: [number, number] =
    located.length > 0 ? [located[0].last_lat as number, located[0].last_lng as number] : [DEPOT.lat, DEPOT.lng]

  return (
    <div className={className} style={{ height, position: 'relative' }}>
      <MapContainer center={center} zoom={12} className="h-full w-full rounded-xl" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geofences.map((g) => (
          <Circle
            key={g.id}
            center={[g.center_lat, g.center_lng]}
            radius={g.radius_m}
            pathOptions={{
              color: GEOFENCE_COLOR[g.type],
              fillColor: GEOFENCE_COLOR[g.type],
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4 4',
            }}
          />
        ))}

        {located.map((vehicle) => (
          <VehicleMapMarker
            key={vehicle.id}
            vehicle={vehicle}
            selected={vehicle.id === selectedVehicleId}
            onSelect={onSelectVehicle}
          />
        ))}

        <FlyToVehicle vehicle={selected} />
      </MapContainer>
      <MapLegend />
    </div>
  )
}
