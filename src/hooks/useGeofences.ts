import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { GeofenceRow } from '@/types/database'

export function useGeofences() {
  return useQuery({
    queryKey: QUERY_KEYS.geofences,
    queryFn: async () => {
      const { data, error } = await supabase.from('geofences').select('*')
      if (error) throw error
      return data as GeofenceRow[]
    },
    staleTime: 5 * 60_000,
  })
}
