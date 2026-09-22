// Hand-written mirror of the Supabase Postgres schema defined in supabase/schema.sql.
// Kept in sync manually for this project instead of `supabase gen types` so the
// assignment can be reviewed without a Supabase CLI login.

export type VehicleType = 'truck' | 'van' | 'car' | 'bike'
export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'offline'
export type DriverStatus = 'active' | 'on_leave' | 'inactive'
export type TripStatus = 'ongoing' | 'completed'
export type AlertType =
  | 'overspeed'
  | 'idle'
  | 'maintenance_due'
  | 'offline'
  | 'low_fuel'
  | 'low_battery'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type GeofenceType = 'depot' | 'customer' | 'restricted'
export type MaintenanceStatus = 'ok' | 'due_soon' | 'overdue'
export type UserRole = 'admin' | 'operator'
export type UserStatus = 'pending' | 'active' | 'rejected' | 'suspended'

export interface ProfileRow {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  status: UserStatus
  avatar_url: string | null
  created_at: string
}

export interface DriverRow {
  id: string
  name: string
  phone: string
  license_number: string
  status: DriverStatus
  rating: number
  photo_url: string | null
  created_at: string
}

export interface VehicleRow {
  id: string
  registration_number: string
  name: string
  make: string
  model: string
  vehicle_type: VehicleType
  status: VehicleStatus
  driver_id: string | null
  fuel_level: number | null
  battery_level: number | null
  ignition_state: boolean
  odometer_km: number
  last_lat: number | null
  last_lng: number | null
  last_heading: number | null
  last_speed_kmh: number | null
  last_seen_at: string | null
  health_score: number
  created_at: string
}

export interface GeofenceRow {
  id: string
  name: string
  type: GeofenceType
  center_lat: number
  center_lng: number
  radius_m: number
  created_at: string
}

export interface TripRow {
  id: string
  vehicle_id: string
  driver_id: string | null
  status: TripStatus
  start_time: string
  end_time: string | null
  start_lat: number
  start_lng: number
  end_lat: number | null
  end_lng: number | null
  start_address: string
  end_address: string | null
  distance_km: number
  duration_sec: number
  avg_speed_kmh: number
  max_speed_kmh: number
  idle_time_sec: number
  halt_count: number
  overspeed_events: number
  created_at: string
}

export interface TripPointRow {
  id: number
  trip_id: string
  ts: string
  lat: number
  lng: number
  speed_kmh: number
  heading: number
}

export interface AlertRow {
  id: string
  vehicle_id: string
  trip_id: string | null
  type: AlertType
  severity: AlertSeverity
  message: string
  is_resolved: boolean
  created_at: string
  resolved_at: string | null
}

export interface MaintenanceLogRow {
  id: string
  vehicle_id: string
  service_type: string
  last_service_km: number
  last_service_date: string
  next_due_km: number
  next_due_date: string
  status: MaintenanceStatus
}
