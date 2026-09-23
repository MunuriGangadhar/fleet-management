import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

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
