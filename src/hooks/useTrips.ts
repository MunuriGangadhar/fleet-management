import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { TripPointRow, TripRow } from '@/types/database'

export function useTripsForVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.trips(vehicleId ?? ''),
    enabled: Boolean(vehicleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId as string)
        .order('start_time', { ascending: false })
      if (error) throw error
      return data as TripRow[]
    },
  })
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.trip(tripId ?? ''),
    enabled: Boolean(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*, vehicle:vehicles(*), driver:drivers(*)')
        .eq('id', tripId as string)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useTripPoints(tripId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.tripPoints(tripId ?? ''),
    enabled: Boolean(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_points')
        .select('*')
        .eq('trip_id', tripId as string)
        .order('ts', { ascending: true })
      if (error) throw error
      return data as TripPointRow[]
    },
  })
}
