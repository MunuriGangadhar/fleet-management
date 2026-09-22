import { haversineKm, bearing, randomBetween, randomInt, type NamedLocation } from './geo'

export interface GeneratedPoint {
  ts: string
  lat: number
  lng: number
  speed_kmh: number
  heading: number
}

export interface GeneratedTrip {
  points: GeneratedPoint[]
  summary: {
    start_time: string
    end_time: string
    start_lat: number
    start_lng: number
    end_lat: number
    end_lng: number
    distance_km: number
    duration_sec: number
    avg_speed_kmh: number
    max_speed_kmh: number
    idle_time_sec: number
    halt_count: number
    overspeed_events: number
  }
}

const SPEED_LIMIT = 60

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

// A handful of waypoints between `from` and `to`, nudged sideways so the
// generated route isn't a perfectly straight line — a cheap stand-in for
// following actual roads without needing a routing API.
function buildWaypoints(from: NamedLocation, to: NamedLocation): NamedLocation[] {
  const legs = randomInt(1, 2)
  const waypoints: NamedLocation[] = [from]
  for (let i = 1; i <= legs; i++) {
    const t = i / (legs + 1)
    const baseLat = lerp(from.lat, to.lat, t)
    const baseLng = lerp(from.lng, to.lng, t)
    const perpOffset = randomBetween(-0.01, 0.01)
    waypoints.push({ name: `waypoint-${i}`, lat: baseLat + perpOffset, lng: baseLng + perpOffset * 0.6 })
  }
  waypoints.push(to)
  return waypoints
}

function segmentLengths(waypoints: NamedLocation[]): number[] {
  const lengths: number[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    lengths.push(haversineKm(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng))
  }
  return lengths
}

function pointAtDistance(
  waypoints: NamedLocation[],
  lengths: number[],
  targetKm: number,
): { lat: number; lng: number } {
  let remaining = clamp(targetKm, 0, lengths.reduce((a, b) => a + b, 0))
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const fraction = lengths[i] === 0 ? 0 : clamp(remaining / lengths[i], 0, 1)
      const a = waypoints[i]
      const b = waypoints[i + 1]
      return { lat: lerp(a.lat, b.lat, fraction), lng: lerp(a.lng, b.lng, fraction) }
    }
    remaining -= lengths[i]
  }
  const last = waypoints[waypoints.length - 1]
  return { lat: last.lat, lng: last.lng }
}

export function generateTrip(
  vehicleType: 'truck' | 'van' | 'car' | 'bike',
  from: NamedLocation,
  to: NamedLocation,
  startTime: Date,
): GeneratedTrip {
  const waypoints = buildWaypoints(from, to)
  const lengths = segmentLengths(waypoints)
  const totalKm = lengths.reduce((a, b) => a + b, 0)

  // Chosen so cruiseSpeed + the -9/+7 random variance below stays under
  // SPEED_LIMIT (60) during ordinary cruising — car/van previously used 62,
  // which is already at the limit, so the resampled-every-~15s noise pushed
  // it over constantly and registered dozens of false "overspeed events"
  // from normal driving instead of just the one deliberate burst per trip.
  const cruiseSpeed = vehicleType === 'truck' ? 52 : vehicleType === 'bike' ? 46 : 50
  const accelZoneKm = Math.min(0.6, totalKm * 0.15)
  const decelZoneKm = Math.min(0.6, totalKm * 0.15)

  const haltCountPlanned = totalKm > 4 ? randomInt(0, 2) : 0
  const haltPositions = Array.from({ length: haltCountPlanned }, () =>
    randomBetween(totalKm * 0.25, totalKm * 0.75),
  ).sort((a, b) => a - b)
  const haltDurationsSec = haltPositions.map(() => randomInt(45, 220))

  const hasOverspeedWindow = totalKm > 2 && Math.random() < 0.4
  const overspeedStart = hasOverspeedWindow ? randomBetween(totalKm * 0.3, totalKm * 0.6) : null
  const overspeedEnd = overspeedStart !== null ? overspeedStart + randomBetween(0.3, 1.2) : null

  const points: GeneratedPoint[] = []
  let cumKm = 0
  let cursorMs = startTime.getTime()
  let idleTimeSec = 0
  let haltCount = 0
  let overspeedEvents = 0
  let wasOverLimit = false
  let haltIdx = 0
  let lastHeading = bearing(waypoints[0].lat, waypoints[0].lng, waypoints[1].lat, waypoints[1].lng)

  // Initial point at trip origin.
  points.push({
    ts: new Date(cursorMs).toISOString(),
    lat: from.lat,
    lng: from.lng,
    speed_kmh: 0,
    heading: lastHeading,
  })

  while (cumKm < totalKm - 0.01) {
    const dt = randomInt(13, 19)

    if (haltIdx < haltPositions.length && cumKm >= haltPositions[haltIdx]) {
      const pos = pointAtDistance(waypoints, lengths, cumKm)
      const steps = Math.max(1, Math.round(haltDurationsSec[haltIdx] / dt))
      for (let s = 0; s < steps; s++) {
        cursorMs += dt * 1000
        idleTimeSec += dt
        points.push({
          ts: new Date(cursorMs).toISOString(),
          lat: pos.lat,
          lng: pos.lng,
          speed_kmh: Math.round(randomBetween(0, 2) * 10) / 10,
          heading: lastHeading,
        })
      }
      haltCount += 1
      haltIdx += 1
      continue
    }

    let speed: number
    if (cumKm < accelZoneKm) {
      speed = lerp(6, cruiseSpeed, cumKm / Math.max(accelZoneKm, 0.01))
    } else if (cumKm > totalKm - decelZoneKm) {
      speed = lerp(cruiseSpeed, 6, (cumKm - (totalKm - decelZoneKm)) / Math.max(decelZoneKm, 0.01))
    } else {
      speed = cruiseSpeed + randomBetween(-9, 7)
    }
    speed = clamp(speed, 4, cruiseSpeed + 10)

    if (overspeedStart !== null && overspeedEnd !== null && cumKm >= overspeedStart && cumKm <= overspeedEnd) {
      speed = randomBetween(64, 84)
    }

    const overLimit = speed > SPEED_LIMIT
    if (overLimit && !wasOverLimit) overspeedEvents += 1
    wasOverLimit = overLimit

    const distStep = speed * (dt / 3600)
    cumKm = Math.min(totalKm, cumKm + distStep)
    cursorMs += dt * 1000

    const pos = pointAtDistance(waypoints, lengths, cumKm)
    const lookahead = pointAtDistance(waypoints, lengths, Math.min(totalKm, cumKm + 0.05))
    lastHeading = bearing(pos.lat, pos.lng, lookahead.lat, lookahead.lng)

    points.push({
      ts: new Date(cursorMs).toISOString(),
      lat: pos.lat,
      lng: pos.lng,
      speed_kmh: Math.round(speed * 10) / 10,
      heading: Math.round(lastHeading * 10) / 10,
    })
  }

  // Final point exactly at destination.
  cursorMs += 12_000
  points.push({
    ts: new Date(cursorMs).toISOString(),
    lat: to.lat,
    lng: to.lng,
    speed_kmh: 0,
    heading: lastHeading,
  })

  let distanceKm = 0
  let maxSpeed = 0
  for (let i = 0; i < points.length; i++) {
    maxSpeed = Math.max(maxSpeed, points[i].speed_kmh)
    if (i > 0) {
      distanceKm += haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    }
  }

  const durationSec = Math.round((cursorMs - startTime.getTime()) / 1000)
  const avgSpeed = durationSec > 0 ? distanceKm / (durationSec / 3600) : 0

  return {
    points,
    summary: {
      start_time: startTime.toISOString(),
      end_time: new Date(cursorMs).toISOString(),
      start_lat: from.lat,
      start_lng: from.lng,
      end_lat: to.lat,
      end_lng: to.lng,
      distance_km: Math.round(distanceKm * 100) / 100,
      duration_sec: durationSec,
      avg_speed_kmh: Math.round(avgSpeed * 10) / 10,
      max_speed_kmh: Math.round(maxSpeed * 10) / 10,
      idle_time_sec: idleTimeSec,
      halt_count: haltCount,
      overspeed_events: overspeedEvents,
    },
  }
}
