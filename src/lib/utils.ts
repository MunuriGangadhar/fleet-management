import clsx, { type ClassValue } from 'clsx'
import { formatDistanceToNowStrict } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
