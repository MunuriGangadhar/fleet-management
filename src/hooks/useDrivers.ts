import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import { clamp } from '@/lib/utils'
import type { DriverRow, VehicleRow } from '@/types/database'

export interface DriverWithStats extends DriverRow {
  vehicle: Pick<VehicleRow, 'id' | 'registration_number' | 'name'> | null
  tripCount: number
  totalDistanceKm: number
  overspeedEvents: number
  safetyScore: number
}

interface DriverTripStatsRow {
  driver_id: string
  trip_count: number
  total_distance_km: number
  overspeed_events: number
}

export function useDrivers() {
  return useQuery({
    queryKey: QUERY_KEYS.drivers,
    queryFn: async () => {
      // Trip aggregation (count/distance/overspeed events per driver) happens
      // in Postgres via the driver_trip_stats view (schema.sql §8), not by
      // pulling every trip row and reducing it here.
      const [driversRes, vehiclesRes, statsRes] = await Promise.all([
        supabase.from('drivers').select('*').order('name', { ascending: true }),
        supabase.from('vehicles').select('id, registration_number, name, driver_id'),
        supabase.from('driver_trip_stats').select('*'),
      ])
      if (driversRes.error) throw driversRes.error
      if (vehiclesRes.error) throw vehiclesRes.error
      if (statsRes.error) throw statsRes.error

      const vehicleByDriver = new Map<string, VehicleRow>()
      for (const v of vehiclesRes.data ?? []) {
        if (v.driver_id) vehicleByDriver.set(v.driver_id, v as VehicleRow)
      }

      const statsByDriver = new Map<string, DriverTripStatsRow>(
        (statsRes.data ?? []).map((row) => [row.driver_id, row as DriverTripStatsRow]),
      )

      return (driversRes.data ?? []).map((d): DriverWithStats => {
        const stats = statsByDriver.get(d.id)
        const tripCount = stats?.trip_count ?? 0
        const totalDistanceKm = stats?.total_distance_km ?? 0
        const overspeedEvents = stats?.overspeed_events ?? 0

        const eventsPer100km = totalDistanceKm > 0 ? (overspeedEvents / totalDistanceKm) * 100 : 0
        const safetyScore = clamp(Math.round(100 - eventsPer100km * 8), 0, 100)

        return {
          ...d,
          vehicle: vehicleByDriver.get(d.id) ?? null,
          tripCount,
          totalDistanceKm: Math.round(totalDistanceKm),
          overspeedEvents,
          safetyScore,
        }
      })
    },
    staleTime: 30_000,
  })
}
