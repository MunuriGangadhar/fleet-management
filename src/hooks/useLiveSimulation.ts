import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const TICK_MS = 4000

export function useLiveSimulation() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastTickAt, setLastTickAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('advance_fleet_simulation')
    if (rpcError) {
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
