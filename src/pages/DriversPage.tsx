import { Link } from 'react-router-dom'
import { ShieldCheck, Route, Phone } from 'lucide-react'
import { useDrivers } from '@/hooks/useDrivers'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const STATUS_COLOR = {
  active: 'var(--success)',
  on_leave: 'var(--warning)',
  inactive: 'var(--text-tertiary)',
} as const

export default function DriversPage() {
  usePageTitle('Drivers', 'Assignments and safety performance across the fleet')
  const { data: drivers, isLoading } = useDrivers()

  if (isLoading || !drivers) {
    return (
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {drivers.map((driver) => (
        <Card key={driver.id}>
          <CardHeader
            title={driver.name}
            subtitle={driver.license_number}
            action={<Badge color={STATUS_COLOR[driver.status]}>{driver.status.replace('_', ' ')}</Badge>}
          />
          <div className="space-y-2.5 px-4 pb-4">
            <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <Phone size={12} /> {driver.phone}
            </p>

            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <ShieldCheck size={13} /> Safety score
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  driver.safetyScore >= 80
                    ? 'text-[var(--success)]'
                    : driver.safetyScore >= 60
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--danger)]',
                )}
              >
                {driver.safetyScore}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1.5">
                <Route size={12} /> {driver.tripCount} trips · {driver.totalDistanceKm} km
              </span>
              <span>{driver.overspeedEvents} overspeed events</span>
            </div>

            {driver.vehicle ? (
              <Link
                to={`/vehicles/${driver.vehicle.id}`}
                className="block rounded-lg border border-[var(--border-default)] px-3 py-2 text-center text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              >
                Assigned to {driver.vehicle.registration_number}
              </Link>
            ) : (
              <p className="rounded-lg border border-dashed border-[var(--border-default)] px-3 py-2 text-center text-xs text-[var(--text-tertiary)]">
                No vehicle assigned
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
