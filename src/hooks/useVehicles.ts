import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { AlertRow, DriverRow, VehicleRow } from '@/types/database'
import type { VehicleWithRelations } from '@/types/domain'

const SEVERITY_BY_RANK: Record<number, AlertRow['severity']> = {
  4: 'critical',
  3: 'high',
  2: 'medium',
  1: 'low',
}

interface AlertSummaryRow {
  vehicle_id: string
  open_alert_count: number
  highest_severity_rank: number
}

async function fetchVehiclesWithRelations(): Promise<VehicleWithRelations[]> {
  const [vehiclesRes, summaryRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*, driver:drivers(*)')
      .order('registration_number', { ascending: true }),
    supabase.from('vehicle_open_alert_summary').select('*'),
  ])

  if (vehiclesRes.error) throw vehiclesRes.error
  if (summaryRes.error) throw summaryRes.error

  const summaryByVehicle = new Map<string, AlertSummaryRow>(
    (summaryRes.data ?? []).map((row) => [row.vehicle_id, row as AlertSummaryRow]),
  )

  return (vehiclesRes.data ?? []).map((row) => {
    const raw = row as VehicleRow & { driver: DriverRow | null }
    const summary = summaryByVehicle.get(raw.id)
    return {
      ...raw,
      open_alert_count: summary?.open_alert_count ?? 0,
      highest_open_severity: summary ? SEVERITY_BY_RANK[summary.highest_severity_rank] ?? null : null,
    }
  })
}

export function useVehicles() {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles,
    queryFn: fetchVehiclesWithRelations,
    staleTime: 15_000,
  })
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicle(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, driver:drivers(*)')
        .eq('id', id as string)
        .single()
      if (error) throw error
      return data as VehicleRow & { driver: DriverRow | null }
    },
  })
}
