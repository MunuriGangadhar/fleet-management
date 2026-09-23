export interface NamedLocation {
  name: string
  lat: number
  lng: number
}

export const LOCATIONS: NamedLocation[] = [
  { name: 'Whitefield Depot', lat: 12.9698, lng: 77.75 },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'MG Road', lat: 12.9757, lng: 77.6069 },
  { name: 'Hebbal', lat: 13.0358, lng: 77.5972 },
  { name: 'Marathahalli', lat: 12.9569, lng: 77.7011 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6389 },
  { name: 'Yeshwanthpur', lat: 13.0284, lng: 77.5501 },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: 'KR Puram', lat: 13.0079, lng: 77.6952 },
  { name: 'Bannerghatta Road', lat: 12.8845, lng: 77.5981 },
]

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lng2 - lng1) * Math.PI) / 180)
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickTwoDistinctLocations(): [NamedLocation, NamedLocation] {
  const a = pickRandom(LOCATIONS)
  let b = pickRandom(LOCATIONS)
  while (b.name === a.name) b = pickRandom(LOCATIONS)
  return [a, b]
}
