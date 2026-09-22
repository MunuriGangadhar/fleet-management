import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const TICK_MS = 4000

/**
 * Drives the "Live simulation" toggle in the topbar. While enabled, calls
 * the `advance_fleet_simulation` Postgres RPC every few seconds, which moves
 * a couple of active vehicles a small step further along their current
 * trip's route and nudges telemetry. Combined with useRealtimeVehicles,
 * this is what makes the fleet map feel alive rather than a static seed.
 */
export function useLiveSimulation() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastTickAt, setLastTickAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('advance_fleet_simulation')
    if (rpcError) {
      // Stop rather than silently retrying every 4s — a broken RPC (e.g. the
      // schema migration hasn't been run yet) shouldn't spam failed requests
      // while the toggle keeps showing "on".
      setError(rpcError.message)
      setIsRunning(false)
      return
    }
    setError(null)
    setLastTickAt(new Date())
  }, [])

  useEffect(() => {
    if (isRunning) {
      tick()
      intervalRef.current = setInterval(tick, TICK_MS)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, tick])

  return {
    isRunning,
    toggle: () => setIsRunning((r) => !r),
    lastTickAt,
    error,
  }
}
