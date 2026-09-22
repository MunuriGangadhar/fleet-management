import type { AlertRow, MaintenanceStatus, VehicleRow } from '@/types/database'
import { clamp } from './utils'

const SEVERITY_BASE_PENALTY: Record<AlertRow['severity'], number> = {
  critical: 22,
  high: 14,
  medium: 6,
  low: 2,
}

export interface HealthScoreBreakdown {
  score: number
  band: 'excellent' | 'good' | 'attention' | 'critical'
  factors: string[]
}

/**
 * Composite 0–100 fleet-health score. Recomputed on the client from live
 * vehicle telemetry + open alerts + maintenance status, rather than trusting
 * a possibly-stale stored column, so the dashboard reflects reality the
 * instant an alert is raised or resolved.
 *
 * Takes an alert *count + highest severity* rather than the full alert list
 * on purpose — that's exactly what `vehicle_open_alert_summary` (see
 * schema.sql §8) gives the fleet list/map/stats views without shipping
 * every alert row to the browser. Vehicle detail pages, which do load the
 * full per-vehicle alert list, derive the same two numbers from it.
 */
export function computeHealthScore(
  vehicle: Pick<VehicleRow, 'fuel_level' | 'battery_level' | 'status' | 'last_seen_at'>,
  openAlerts: { count: number; highestSeverity: AlertRow['severity'] | null },
  maintenanceStatus: MaintenanceStatus | null,
): HealthScoreBreakdown {
  let score = 100
  const factors: string[] = []

  if (vehicle.fuel_level !== null) {
    if (vehicle.fuel_level < 15) {
      score -= 15
      factors.push('Critically low fuel')
    } else if (vehicle.fuel_level < 30) {
      score -= 6
      factors.push('Low fuel')
    }
  }

  if (vehicle.battery_level !== null) {
    if (vehicle.battery_level < 20) {
      score -= 15
      factors.push('Critically low battery')
    } else if (vehicle.battery_level < 40) {
      score -= 6
      factors.push('Low battery')
    }
  }

  if (openAlerts.count > 0 && openAlerts.highestSeverity) {
    const base = SEVERITY_BASE_PENALTY[openAlerts.highestSeverity]
    const extraForVolume = Math.min(openAlerts.count - 1, 4) * 3
    score -= Math.min(base + extraForVolume, 45)
    factors.push(`${openAlerts.count} open alert${openAlerts.count === 1 ? '' : 's'}`)
  }

  if (maintenanceStatus === 'overdue') {
    score -= 20
    factors.push('Maintenance overdue')
  } else if (maintenanceStatus === 'due_soon') {
    score -= 8
    factors.push('Maintenance due soon')
  }

  if (vehicle.status === 'maintenance') {
    score -= 10
    factors.push('Currently in service')
  }

  if (vehicle.status === 'offline') {
    score -= 12
    factors.push('Vehicle offline')
  }

  score = clamp(Math.round(score), 0, 100)

  const band: HealthScoreBreakdown['band'] =
    score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 40 ? 'attention' : 'critical'

  return { score, band, factors }
}

export const HEALTH_BAND_COLOR: Record<HealthScoreBreakdown['band'], string> = {
  excellent: 'var(--success)',
  good: 'var(--info)',
  attention: 'var(--warning)',
  critical: 'var(--danger)',
}

export const HEALTH_BAND_LABEL: Record<HealthScoreBreakdown['band'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  attention: 'Needs attention',
  critical: 'Critical',
}
