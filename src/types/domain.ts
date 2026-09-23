import type { AlertRow, DriverRow, VehicleRow } from './database'

export interface VehicleWithRelations extends VehicleRow {
  driver: DriverRow | null
  open_alert_count: number
  highest_open_severity: AlertRow['severity'] | null
}

export interface AlertWithVehicle extends AlertRow {
  vehicle: Pick<VehicleRow, 'id' | 'registration_number' | 'name' | 'vehicle_type'> | null
}
