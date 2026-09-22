import L from 'leaflet'
import { VEHICLE_STATUS_COLOR } from '@/lib/constants'
import type { VehicleStatus } from '@/types/database'

// Resolve CSS custom properties to concrete color values so they can be
// baked into an inline SVG string (divIcon HTML doesn't inherit page CSS
// variables reliably across Leaflet's panes).
function resolveColor(cssVar: string): string {
  if (typeof window === 'undefined') return '#888'
  const match = cssVar.match(/var\((--[a-z-]+)\)/)
  if (!match) return cssVar
  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || '#888'
}

export function buildVehicleIcon(status: VehicleStatus, heading: number, selected: boolean) {
  const color = resolveColor(VEHICLE_STATUS_COLOR[status])
  const size = selected ? 34 : 26
  const pulse = status === 'active'

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      ${
        pulse
          ? `<span class="vehicle-pulse" style="position:absolute;inset:0;border-radius:50%;background:${color};"></span>`
          : ''
      }
      <div style="
        position:relative;
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${color};
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        transform:rotate(${heading}deg);
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4 14h5v8l7-12h-5z" transform="rotate(45 12 12)"/>
        </svg>
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'vehicle-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function buildBreadcrumbIcon(color: string, size = 8) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1.5px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.3);"></div>`,
    className: 'breadcrumb-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
