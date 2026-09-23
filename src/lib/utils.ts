import clsx, { type ClassValue } from 'clsx'
import { formatDistanceToNowStrict } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    return `${formatDistanceToNowStrict(new Date(iso))} ago`
  } catch {
    return 'Unknown'
  }
}

export function formatOdometer(km: number): string {
  return `${Math.round(km).toLocaleString('en-IN')} km`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
