import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
 * Tweens between successive lat/lng values over `durationMs` instead of
 * snapping the marker straight to the new position. Realtime updates
 * (from useRealtimeVehicles, or the live-simulation RPC) arrive as discrete
 * jumps every few seconds — without this, markers would visibly teleport.
 *
 * `currentRef` mirrors the last rendered position on every animation frame,
 * not just on completion — so if a new target arrives mid-tween (a second
 * realtime update within the same ~900ms window), the next tween starts
 * from where the marker visually is, not from wherever it was before the
 * *previous* tween began. Without that, a fast update would make the
 * marker jump backwards before continuing.
 */
export function useAnimatedLatLng(
  lat: number,
  lng: number,
  durationMs = 900,
): { lat: number; lng: number } {
  const [pos, setPos] = useState({ lat, lng })
  const currentRef = useRef({ lat, lng })
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = currentRef.current
    if (from.lat === lat && from.lng === lng) return

    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    const startTime = performance.now()

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / durationMs)
      const eased = easeOutCubic(t)
      const next = {
        lat: from.lat + (lat - from.lat) * eased,
        lng: from.lng + (lng - from.lng) * eased,
      }
      currentRef.current = next
      setPos(next)
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [lat, lng, durationMs])

  return pos
}
