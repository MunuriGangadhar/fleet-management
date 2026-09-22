import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ALERT_SEVERITY_ORDER, QUERY_KEYS } from '@/lib/constants'
import type { AlertWithVehicle } from '@/types/domain'

export function useAlerts(options?: { includeResolved?: boolean; vehicleId?: string }) {
  const includeResolved = options?.includeResolved ?? false
  const vehicleId = options?.vehicleId

  return useQuery({
    queryKey: [...QUERY_KEYS.alerts, { includeResolved, vehicleId }],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select('*, vehicle:vehicles(id, registration_number, name, vehicle_type)')
        .order('created_at', { ascending: false })

      if (!includeResolved) query = query.eq('is_resolved', false)
      if (vehicleId) query = query.eq('vehicle_id', vehicleId)

      const { data, error } = await query
      if (error) throw error

      const rows = (data ?? []) as AlertWithVehicle[]
      return rows.sort((a, b) => {
        const bySeverity = ALERT_SEVERITY_ORDER[b.severity] - ALERT_SEVERITY_ORDER[a.severity]
        if (bySeverity !== 0) return bySeverity
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    },
    staleTime: 10_000,
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles })
    },
  })
}
