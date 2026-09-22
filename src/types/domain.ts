import type { AlertRow, DriverRow, VehicleRow } from './database'

// Composite view models used across the UI — a vehicle joined with its
// driver and open-alert count, as returned by the `vehicles_overview` hook.
export interface VehicleWithRelations extends VehicleRow {
  driver: DriverRow | null
  open_alert_count: number
  highest_open_severity: AlertRow['severity'] | null
}

export interface AlertWithVehicle extends AlertRow {
  vehicle: Pick<VehicleRow, 'id' | 'registration_number' | 'name' | 'vehicle_type'> | null
}

export interface FleetSummary {
  total: number
  active: number
  idle: number
  maintenance: number
  offline: number
  openAlerts: number
  criticalAlerts: number
  avgHealthScore: number
}
