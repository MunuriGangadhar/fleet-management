import { VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL } from '@/lib/constants'
import type { VehicleStatus } from '@/types/database'

const STATUSES: VehicleStatus[] = ['active', 'idle', 'maintenance', 'offline']

export function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[400] flex gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/95 px-3 py-2 text-xs shadow-md backdrop-blur">
      {STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: VEHICLE_STATUS_COLOR[status] }}
          />
          <span className="text-[var(--text-secondary)]">{VEHICLE_STATUS_LABEL[status]}</span>
        </div>
      ))}
    </div>
  )
}
