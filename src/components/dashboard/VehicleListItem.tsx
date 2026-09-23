import { Fuel, BatteryMedium, User, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { HealthGauge } from '@/components/ui/HealthGauge'
import { computeHealthScore } from '@/lib/healthScore'
import { VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL } from '@/lib/constants'
import { cn, formatRelativeTime, formatSpeed } from '@/lib/utils'
import type { VehicleWithRelations } from '@/types/domain'

export function VehicleListItem({
  vehicle,
  selected,
  onClick,
}: {
  vehicle: VehicleWithRelations
  selected?: boolean
  onClick?: () => void
}) {
  const health = computeHealthScore(
    vehicle,
    { count: vehicle.open_alert_count, highestSeverity: vehicle.highest_open_severity },
    null,
  )

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-transparent hover:bg-[var(--bg-muted)]',
      )}
    >
      <HealthGauge breakdown={health} size={38} showLabel={false} />

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold text-[var(--text-primary)]"
          title={vehicle.registration_number}
        >
          {vehicle.registration_number}
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          <Badge size="sm" color={VEHICLE_STATUS_COLOR[vehicle.status]}>
            {VEHICLE_STATUS_LABEL[vehicle.status]}
          </Badge>
          <span
            className="flex min-w-0 items-center gap-1 truncate text-[11px] text-[var(--text-tertiary)]"
            title={vehicle.driver?.name ?? 'Unassigned'}
          >
            <User size={11} className="shrink-0" />
            <span className="truncate">{vehicle.driver?.name ?? 'Unassigned'}</span>
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-[var(--text-tertiary)]">
          {vehicle.fuel_level !== null && (
            <span className="flex shrink-0 items-center gap-1">
              <Fuel size={11} /> {Math.round(vehicle.fuel_level)}%
            </span>
          )}
          {vehicle.battery_level !== null && (
            <span className="flex shrink-0 items-center gap-1">
              <BatteryMedium size={11} /> {Math.round(vehicle.battery_level)}%
            </span>
          )}
          <span className="shrink-0">{formatSpeed(vehicle.last_speed_kmh ?? 0)}</span>
          <span className="truncate">{formatRelativeTime(vehicle.last_seen_at)}</span>
        </div>
      </div>

      {vehicle.open_alert_count > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold text-white">
          {vehicle.open_alert_count}
        </span>
      )}

      <Link
        to={`/vehicles/${vehicle.id}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--accent)]"
        title="View vehicle details"
      >
        <ChevronRight size={16} />
      </Link>
    </motion.div>
  )
}
