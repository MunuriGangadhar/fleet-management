import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { MaintenanceLogRow } from '@/types/database'

export function useMaintenanceForVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.maintenance(vehicleId ?? ''),
    enabled: Boolean(vehicleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('vehicle_id', vehicleId as string)
        .order('next_due_date', { ascending: true })
      if (error) throw error
      return data as MaintenanceLogRow[]
    },
  })
}
