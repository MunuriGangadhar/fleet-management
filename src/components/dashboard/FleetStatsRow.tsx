import { Truck, Activity, Wrench, WifiOff, AlertTriangle, HeartPulse } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { computeHealthScore } from '@/lib/healthScore'
import type { VehicleStatus } from '@/types/database'
import type { VehicleWithRelations } from '@/types/domain'

export function FleetStatsRow({
  vehicles,
  statusFilter,
  onStatusFilterChange,
}: {
  vehicles: VehicleWithRelations[]
  statusFilter: VehicleStatus | null
  onStatusFilterChange: (status: VehicleStatus | null) => void
}) {
  const counts = vehicles.reduce(
    (acc, v) => {
      acc[v.status] += 1
      if (v.highest_open_severity === 'critical' || v.highest_open_severity === 'high') {
        acc.attention += 1
      }
      return acc
    },
    { active: 0, idle: 0, maintenance: 0, offline: 0, attention: 0 },
  )

  const avgHealth =
    vehicles.length === 0
      ? 0
      : Math.round(
          vehicles.reduce(
            (sum, v) =>
              sum +
              computeHealthScore(
                v,
                { count: v.open_alert_count, highestSeverity: v.highest_open_severity },
                null,
              ).score,
            0,
          ) / vehicles.length,
        )

  function toggle(status: VehicleStatus) {
    onStatusFilterChange(statusFilter === status ? null : status)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Total vehicles" value={vehicles.length} icon={<Truck size={17} />} />
      <StatCard
        label="Active"
        value={counts.active}
        icon={<Activity size={17} />}
        accent="var(--success)"
        onClick={() => toggle('active')}
        active={statusFilter === 'active'}
      />
      <StatCard
        label="Idle"
        value={counts.idle}
        icon={<Activity size={17} />}
        accent="var(--warning)"
        onClick={() => toggle('idle')}
        active={statusFilter === 'idle'}
      />
      <StatCard
        label="In maintenance"
        value={counts.maintenance}
        icon={<Wrench size={17} />}
        accent="var(--info)"
        onClick={() => toggle('maintenance')}
        active={statusFilter === 'maintenance'}
      />
      <StatCard
        label="Offline"
        value={counts.offline}
        icon={<WifiOff size={17} />}
        accent="var(--text-tertiary)"
        onClick={() => toggle('offline')}
        active={statusFilter === 'offline'}
      />
      <StatCard
        label="Avg. health score"
        value={avgHealth}
        icon={<HeartPulse size={17} />}
        accent={avgHealth >= 70 ? 'var(--success)' : 'var(--warning)'}
        trend={counts.attention > 0 ? `${counts.attention} need attention` : undefined}
      />
    </div>
  )
}

export function AttentionBanner({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-3.5 py-2.5 text-sm text-[var(--danger)]">
      <AlertTriangle size={16} />
      <span className="font-medium">
        {count} vehicle{count === 1 ? '' : 's'} need immediate attention
      </span>
    </div>
  )
}
