import { Link } from 'react-router-dom'
import { Download, MapPin } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { downloadCsv } from '@/lib/csv'
import { formatDistance, formatDuration } from '@/lib/utils'
import { format } from 'date-fns'
import type { TripRow } from '@/types/database'

export function TripHistoryList({
  trips,
  vehicleRegistration,
}: {
  trips: TripRow[]
  vehicleRegistration: string
}) {
  function exportCsv() {
    downloadCsv(
      `${vehicleRegistration}-trips.csv`,
      trips.map((t) => ({
        start_time: t.start_time,
        end_time: t.end_time ?? '',
        start_address: t.start_address,
        end_address: t.end_address ?? '',
        distance_km: t.distance_km,
        duration_min: Math.round(t.duration_sec / 60),
        avg_speed_kmh: t.avg_speed_kmh,
        max_speed_kmh: t.max_speed_kmh,
        idle_time_min: Math.round(t.idle_time_sec / 60),
        halt_count: t.halt_count,
        overspeed_events: t.overspeed_events,
      })),
    )
  }

  return (
    <Card>
      <CardHeader
        title="Trip history"
        subtitle={`${trips.length} recorded trips`}
        action={
          <Button size="sm" variant="secondary" icon={<Download size={13} />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="divide-y divide-[var(--border-subtle)]">
        {trips.length === 0 && (
          <EmptyState title="No trips yet" description="This vehicle has no recorded trips." />
        )}
        {trips.map((trip) => (
          <Link
            key={trip.id}
            to={`/vehicles/${trip.vehicle_id}/trips/${trip.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-muted)]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {format(new Date(trip.start_time), 'dd MMM, HH:mm')}
                </p>
                {trip.status === 'ongoing' && <Badge color="var(--success)">Ongoing</Badge>}
                {trip.overspeed_events > 0 && (
                  <Badge color="var(--warning)">{trip.overspeed_events} overspeed</Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--text-tertiary)]">
                <MapPin size={11} />
                {trip.start_address} → {trip.end_address ?? 'In progress'}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">
                {formatDistance(trip.distance_km)}
              </p>
              <p>{formatDuration(trip.duration_sec)}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
