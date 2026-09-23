import type { AlertSeverity, AlertType, VehicleStatus, VehicleType } from '@/types/database'

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  active: 'Active',
  idle: 'Idle',
  maintenance: 'Maintenance',
  offline: 'Offline',
}

export const VEHICLE_STATUS_COLOR: Record<VehicleStatus, string> = {
  active: 'var(--success)',
  idle: 'var(--warning)',
  maintenance: 'var(--info)',
  offline: 'var(--text-tertiary)',
}

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  truck: 'Truck',
  van: 'Van',
  car: 'Car',
  bike: 'Bike',
}

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  overspeed: 'Overspeeding',
  idle: 'Excessive idling',
  maintenance_due: 'Maintenance due',
  offline: 'Vehicle offline',
  low_fuel: 'Low fuel',
  low_battery: 'Low battery',
}

export const ALERT_SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
}

export const ALERT_SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: 'var(--danger)',
  high: 'var(--danger)',
  medium: 'var(--warning)',
  low: 'var(--info)',
}

export const DEPOT = {
  name: 'Whitefield Depot',
  lat: 12.9698,
  lng: 77.75,
}

export const QUERY_KEYS = {
  vehicles: ['vehicles'] as const,
  vehicle: (id: string) => ['vehicles', id] as const,
  trips: (vehicleId: string) => ['trips', vehicleId] as const,
  trip: (id: string) => ['trip', id] as const,
  tripPoints: (id: string) => ['trip-points', id] as const,
  alerts: ['alerts'] as const,
  drivers: ['drivers'] as const,
  maintenance: (vehicleId: string) => ['maintenance', vehicleId] as const,
  geofences: ['geofences'] as const,
}
