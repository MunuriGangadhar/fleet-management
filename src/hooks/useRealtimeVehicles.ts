import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { VehicleRow } from '@/types/database'
import type { VehicleWithRelations } from '@/types/domain'

/**
 * Subscribes to Postgres change events on `vehicles` via Supabase Realtime
 * and patches the React Query cache in place, so every open tab sees a
 * vehicle's position/telemetry move live without polling or a full refetch.
 * Requires `vehicles` to be added to the `supabase_realtime` publication
 * (done in supabase/schema.sql).
 */
export function useRealtimeVehicles() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => {
          const updated = payload.new as VehicleRow

          queryClient.setQueryData<VehicleWithRelations[]>(QUERY_KEYS.vehicles, (current) => {
            if (!current) return current
            return current.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
          })

          queryClient.setQueryData(QUERY_KEYS.vehicle(updated.id), (current: unknown) => {
            if (!current) return current
            return { ...(current as object), ...updated }
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
