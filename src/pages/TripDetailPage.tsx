import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Route, Timer, Gauge, TrendingUp, Coffee, TriangleAlert, PauseCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useTrip, useTripPoints } from '@/hooks/useTrips'
import { usePageTitle } from '@/hooks/usePageTitle'
import { RoutePlayback } from '@/components/map/RoutePlayback'
import { MetricCard } from '@/components/vehicle/MetricCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatDistance, formatDuration, formatSpeed } from '@/lib/utils'
import type { DriverRow, TripRow, VehicleRow } from '@/types/database'

export default function TripDetailPage() {
  const { id: vehicleId, tripId } = useParams<{ id: string; tripId: string }>()
  const { data: trip, isLoading: tripLoading } = useTrip(tripId)
  const { data: points, isLoading: pointsLoading } = useTripPoints(tripId)

  const typedTrip = trip as (TripRow & { vehicle: VehicleRow; driver: DriverRow | null }) | undefined

  usePageTitle(
    typedTrip ? `Trip · ${typedTrip.vehicle.registration_number}` : 'Trip detail',
    typedTrip ? format(new Date(typedTrip.start_time), "dd MMM yyyy 'at' HH:mm") : undefined,
  )

  if (tripLoading || !typedTrip) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-5">
      <Link
        to={`/vehicles/${vehicleId}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={13} /> Back to {typedTrip.vehicle.registration_number}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {typedTrip.start_address} → {typedTrip.end_address ?? 'In progress'}
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            {format(new Date(typedTrip.start_time), 'dd MMM yyyy, HH:mm')}
            {typedTrip.end_time && ` – ${format(new Date(typedTrip.end_time), 'HH:mm')}`} ·{' '}
            {typedTrip.driver?.name ?? 'Unassigned driver'}
          </p>
        </div>
        {typedTrip.status === 'ongoing' && <Badge color="var(--success)">Ongoing</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Distance" value={formatDistance(typedTrip.distance_km)} icon={<Route size={14} />} />
        <MetricCard label="Duration" value={formatDuration(typedTrip.duration_sec)} icon={<Timer size={14} />} />
        <MetricCard label="Avg speed" value={formatSpeed(typedTrip.avg_speed_kmh)} icon={<Gauge size={14} />} />
        <MetricCard label="Max speed" value={formatSpeed(typedTrip.max_speed_kmh)} icon={<TrendingUp size={14} />} />
        <MetricCard label="Idle time" value={formatDuration(typedTrip.idle_time_sec)} icon={<Coffee size={14} />} />
        <MetricCard
          label="Overspeed events"
          value={typedTrip.overspeed_events}
          icon={<TriangleAlert size={14} />}
        />
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Route playback</h3>
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <PauseCircle size={13} />
            {typedTrip.halt_count} halt{typedTrip.halt_count === 1 ? '' : 's'} detected
          </p>
        </div>
        {pointsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <RoutePlayback points={points ?? []} />
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" /> &lt; 30 km/h
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#eab308]" /> 30–60 km/h
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" /> &gt; 60 km/h
          </span>
        </div>
      </div>
    </div>
  )
}
