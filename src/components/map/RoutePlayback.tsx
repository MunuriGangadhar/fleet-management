import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatSpeed } from '@/lib/utils'
import type { TripPointRow } from '@/types/database'

const SPEED_BANDS = [
  { max: 30, color: '#22c55e' },
  { max: 60, color: '#eab308' },
  { max: Infinity, color: '#ef4444' },
]

function speedColor(kmh: number): string {
  return SPEED_BANDS.find((b) => kmh <= b.max)?.color ?? '#ef4444'
}

function flagIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function carIcon() {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function FitToRoute({ points }: { points: TripPointRow[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [32, 32] })
  }, [map, points])
  return null
}

export function RoutePlayback({ points, height = 380 }: { points: TripPointRow[]; height?: number }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const segments = useMemo(() => {
    const result: { positions: [number, number][]; color: string }[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      result.push({
        positions: [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        color: speedColor((a.speed_kmh + b.speed_kmh) / 2),
      })
    }
    return result
  }, [points])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIndex((i) => {
          if (i >= points.length - 1) {
            setPlaying(false)
            return i
          }
          return i + 1
        })
      }, 220 / speedMultiplier)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, speedMultiplier, points.length])

  if (points.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-sm text-[var(--text-tertiary)]"
      >
        No route telemetry recorded for this trip.
      </div>
    )
  }

  const current = points[index]

  return (
    <div className="space-y-3">
      <div style={{ height }} className="overflow-hidden rounded-xl">
        <MapContainer center={[current.lat, current.lng]} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {segments.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg.positions}
              pathOptions={{ color: seg.color, weight: 4, opacity: 0.85 }}
            />
          ))}
          <Marker position={[points[0].lat, points[0].lng]} icon={flagIcon('#22c55e')}>
            <Popup>Trip start</Popup>
          </Marker>
          <Marker
            position={[points[points.length - 1].lat, points[points.length - 1].lng]}
            icon={flagIcon('#ef4444')}
          >
            <Popup>Trip end</Popup>
          </Marker>
          <Marker position={[current.lat, current.lng]} icon={carIcon()}>
            <Popup>{formatSpeed(current.speed_kmh)}</Popup>
          </Marker>
          <FitToRoute points={points} />
        </MapContainer>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            if (index >= points.length - 1) setIndex(0)
            setPlaying((p) => !p)
          }}
          icon={playing ? <Pause size={13} /> : <Play size={13} />}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIndex(0)
            setPlaying(false)
          }}
          icon={<RotateCcw size={13} />}
        >
          Reset
        </Button>

        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false)
            setIndex(Number(e.target.value))
          }}
          className="flex-1 accent-[var(--accent)]"
        />

        <select
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
          className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-primary)]"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>

        <div className="w-28 shrink-0 text-right text-xs tabular-nums text-[var(--text-secondary)]">
          {formatSpeed(current.speed_kmh)} · {new Date(current.ts).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
