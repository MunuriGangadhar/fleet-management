// One-shot seed script for the FleetPulse Supabase backend.
//
// Run with: npm run seed
//
// Uses the service-role key (server-side only, bypasses RLS) to:
//   1. create/reuse a demo auth user you can log in with
//   2. wipe and repopulate drivers, vehicles, geofences, trips, trip_points,
//      alerts, and maintenance_logs with a plausible week of fleet activity
//
// Safe to re-run — it clears its own tables first.

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { DRIVERS_SEED, VEHICLES_SEED } from './lib/fleetData'
import { LOCATIONS, pickTwoDistinctLocations, randomBetween, randomInt, type NamedLocation } from './lib/geo'
import { generateTrip, type GeneratedTrip } from './lib/generateTrip'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL ?? 'operator@fleetpulse.demo'
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'FleetDemo!2024'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\nMissing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Copy .env.example to .env and fill in the server-side values before running the seed script.\n',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function findLocation(name: string): NamedLocation {
  const loc = LOCATIONS.find((l) => l.name === name)
  if (!loc) throw new Error(`Unknown seed location: ${name}`)
  return loc
}

async function resetTables() {
  console.log('Clearing existing demo data...')
  const tables = [
    'trip_points',
    'alerts',
    'maintenance_logs',
    'trips',
    'vehicles',
    'drivers',
    'geofences',
  ]
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) throw new Error(`Failed clearing ${table}: ${error.message}`)
  }
}

async function ensureDemoUser(): Promise<string> {
  console.log(`Ensuring demo login ${DEMO_EMAIL} exists...`)
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Ops Manager' },
  })

  let userId: string

  if (!createError && created.user) {
    userId = created.user.id
  } else if (createError && !/already been registered|already exists/i.test(createError.message)) {
    throw createError
  } else {
    // User already exists — look it up and make sure the password matches
    // what's in .env, so `npm run seed` remains a reliable way to get in.
    userId = ''
    let page = 1
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (error) throw error
      const existing = data.users.find((u) => u.email === DEMO_EMAIL)
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD })
        userId = existing.id
        break
      }
      if (data.users.length < 200) break
      page += 1
    }
    if (!userId) throw new Error(`Could not find or create demo user ${DEMO_EMAIL}`)
  }

  // The handle_new_user() trigger always creates new profiles as
  // role='operator', status='pending' — it never trusts client-supplied
  // metadata for role/status (that would be a privilege-escalation hole
  // now that self-signup exists). So the demo account is bootstrapped into
  // an active admin here explicitly, using the service-role key. This is
  // also what makes the demo account useful as the *first* admin: without
  // it, every self-signup would be stuck pending with nobody able to
  // approve them.
  const { error: promoteError } = await supabase
    .from('profiles')
    .update({ full_name: 'Ops Manager', email: DEMO_EMAIL, role: 'admin', status: 'active' })
    .eq('id', userId)
  if (promoteError) throw promoteError

  return userId
}

async function seedDrivers() {
  console.log(`Inserting ${DRIVERS_SEED.length} drivers...`)
  const { data, error } = await supabase.from('drivers').insert(DRIVERS_SEED).select('*')
  if (error) throw error
  return data
}

interface VehicleInsertResult {
  id: string
  registration_number: string
  vehicle_type: 'truck' | 'van' | 'car' | 'bike'
  isEV: boolean
  homeBase: string
  driver_id: string | null
  status: 'active' | 'idle' | 'maintenance' | 'offline'
}

async function seedVehicles(drivers: { id: string }[]) {
  console.log(`Inserting ${VEHICLES_SEED.length} vehicles...`)

  // Status distribution: mostly on the road, a couple idle, a couple in
  // for service, one dark — enough variety for the dashboard to feel real.
  const statusCycle: VehicleInsertResult['status'][] = [
    'active', 'active', 'idle', 'active', 'active', 'maintenance', 'active',
    'idle', 'active', 'active', 'maintenance', 'active', 'offline', 'active',
  ]

  const rows = VEHICLES_SEED.map((v, i) => {
    const driver = i < drivers.length - 2 ? drivers[i] : null // leave a few unassigned
    const status = statusCycle[i % statusCycle.length]
    const startingOdometer = randomInt(12_000, 78_000)
    return {
      registration_number: v.registration_number,
      name: v.name,
      make: v.make,
      model: v.model,
      vehicle_type: v.vehicle_type,
      status,
      driver_id: driver?.id ?? null,
      fuel_level: v.isEV ? null : Math.round(randomBetween(35, 95) * 10) / 10,
      battery_level: v.isEV ? Math.round(randomBetween(35, 95) * 10) / 10 : null,
      ignition_state: status === 'active',
      odometer_km: startingOdometer,
    }
  })

  const { data, error } = await supabase.from('vehicles').insert(rows).select('*')
  if (error) throw error

  return data.map((row, i): VehicleInsertResult => ({
    id: row.id,
    registration_number: row.registration_number,
    vehicle_type: row.vehicle_type,
    isEV: VEHICLES_SEED[i].isEV,
    homeBase: VEHICLES_SEED[i].homeBase,
    driver_id: row.driver_id,
    status: row.status,
  }))
}

async function seedGeofences() {
  console.log('Inserting geofences...')
  const depot = findLocation('Whitefield Depot')
  const customer = findLocation('Electronic City')
  const { error } = await supabase.from('geofences').insert([
    { name: 'Whitefield Depot', type: 'depot', center_lat: depot.lat, center_lng: depot.lng, radius_m: 400 },
    { name: 'Electronic City Hub', type: 'customer', center_lat: customer.lat, center_lng: customer.lng, radius_m: 350 },
  ])
  if (error) throw error
}

interface VehicleRuntimeState {
  vehicleId: string
  odometerKm: number
  fuelLevel: number | null
  batteryLevel: number | null
}

async function seedTripsForFleet(vehicles: VehicleInsertResult[]) {
  console.log('Generating trip history (this creates the route telemetry)...')

  const allTripRows: Record<string, unknown>[] = []
  const allPointRows: Record<string, unknown>[] = []
  const tripMetaById = new Map<
    string,
    { vehicleId: string; generated: GeneratedTrip; isOngoing: boolean }
  >()

  const now = Date.now()
  const runtimeStates: VehicleRuntimeState[] = []

  for (const vehicle of vehicles) {
    const driverId = vehicle.driver_id
    const tripCount = randomInt(4, 8)
    let cursor = findLocation(vehicle.homeBase)
    let odometerAccum = 0
    let fuelLevel: number | null = null
    let batteryLevel: number | null = null

    // Spread trips across the last 6 days, oldest first.
    const daysAgoStarts = Array.from({ length: tripCount }, (_, i) =>
      now - randomBetween(0.1, 6) * 86_400_000 - i * 3_600_000,
    ).sort((a, b) => a - b)

    for (let i = 0; i < tripCount; i++) {
      const isLast = i === tripCount - 1
      const makeOngoing = isLast && vehicle.status === 'active'

      const [, dest] = pickTwoDistinctLocations()
      const from = cursor
      const to = dest.name === from.name ? findLocation('Whitefield Depot') : dest

      const generated = generateTrip(vehicle.vehicle_type, from, to, new Date(daysAgoStarts[i]))

      let tripForInsert = generated
      let tripId = crypto.randomUUID()

      if (makeOngoing) {
        // Truncate to a random cut point so the vehicle looks "mid-trip"
        // right now, which is what makes the live map interesting.
        const cutoff = Math.max(3, Math.round(generated.points.length * randomBetween(0.35, 0.75)))
        const truncatedPoints = generated.points.slice(0, cutoff)
        tripForInsert = {
          points: truncatedPoints,
          summary: {
            ...generated.summary,
            end_time: truncatedPoints[truncatedPoints.length - 1].ts,
            end_lat: truncatedPoints[truncatedPoints.length - 1].lat,
            end_lng: truncatedPoints[truncatedPoints.length - 1].lng,
          },
        }
      }

      allTripRows.push({
        id: tripId,
        vehicle_id: vehicle.id,
        driver_id: driverId,
        status: makeOngoing ? 'ongoing' : 'completed',
        start_time: tripForInsert.summary.start_time,
        end_time: makeOngoing ? null : tripForInsert.summary.end_time,
        start_lat: tripForInsert.summary.start_lat,
        start_lng: tripForInsert.summary.start_lng,
        end_lat: makeOngoing ? null : tripForInsert.summary.end_lat,
        end_lng: makeOngoing ? null : tripForInsert.summary.end_lng,
        start_address: from.name,
        end_address: makeOngoing ? null : to.name,
        distance_km: tripForInsert.summary.distance_km,
        duration_sec: tripForInsert.summary.duration_sec,
        avg_speed_kmh: tripForInsert.summary.avg_speed_kmh,
        max_speed_kmh: tripForInsert.summary.max_speed_kmh,
        idle_time_sec: tripForInsert.summary.idle_time_sec,
        halt_count: tripForInsert.summary.halt_count,
        overspeed_events: tripForInsert.summary.overspeed_events,
      })

      for (const p of tripForInsert.points) {
        allPointRows.push({
          trip_id: tripId,
          ts: p.ts,
          lat: p.lat,
          lng: p.lng,
          speed_kmh: p.speed_kmh,
          heading: p.heading,
        })
      }

      tripMetaById.set(tripId, { vehicleId: vehicle.id, generated: tripForInsert, isOngoing: makeOngoing })

      odometerAccum += tripForInsert.summary.distance_km
      cursor = makeOngoing ? cursor : to

      // Fuel/battery drain roughly proportional to distance covered.
      const consumptionRate =
        vehicle.vehicle_type === 'truck' ? 0.22 : vehicle.vehicle_type === 'van' ? 0.18 : vehicle.vehicle_type === 'car' ? 0.13 : 0.28
      if (vehicle.isEV) {
        batteryLevel = Math.max(4, (batteryLevel ?? 90) - tripForInsert.summary.distance_km * consumptionRate)
      } else {
        fuelLevel = Math.max(4, (fuelLevel ?? 90) - tripForInsert.summary.distance_km * consumptionRate)
      }
    }

    runtimeStates.push({
      vehicleId: vehicle.id,
      odometerKm: odometerAccum,
      fuelLevel: vehicle.isEV ? null : fuelLevel,
      batteryLevel: vehicle.isEV ? batteryLevel : null,
    })
  }

  console.log(`Inserting ${allTripRows.length} trips...`)
  for (const batch of chunk(allTripRows, 100)) {
    const { error } = await supabase.from('trips').insert(batch)
    if (error) throw error
  }

  console.log(`Inserting ${allPointRows.length} trip telemetry points...`)
  for (const batch of chunk(allPointRows, 500)) {
    const { error } = await supabase.from('trip_points').insert(batch)
    if (error) throw error
  }

  return { runtimeStates, tripMetaById }
}

async function finalizeVehiclesAndAlerts(
  vehicles: VehicleInsertResult[],
  runtimeStates: VehicleRuntimeState[],
  tripMetaById: Map<string, { vehicleId: string; generated: GeneratedTrip; isOngoing: boolean }>,
) {
  console.log('Finalizing vehicle telemetry, maintenance logs, and alerts...')

  const alertRows: Record<string, unknown>[] = []
  const maintenanceRows: Record<string, unknown>[] = []

  for (const vehicle of vehicles) {
    const state = runtimeStates.find((r) => r.vehicleId === vehicle.id)!
    const { data: vehicleRow } = await supabase
      .from('vehicles')
      .select('odometer_km')
      .eq('id', vehicle.id)
      .single()
    const baseOdometer = vehicleRow?.odometer_km ?? 0
    const finalOdometer = Math.round((baseOdometer + state.odometerKm) * 10) / 10

    const latestTripEntry = [...tripMetaById.entries()]
      .filter(([, meta]) => meta.vehicleId === vehicle.id)
      .sort((a, b) => (a[1].generated.summary.start_time < b[1].generated.summary.start_time ? 1 : -1))[0]

    const latestTrip = latestTripEntry?.[1]
    const latestTripId = latestTripEntry?.[0]
    const lastPoint = latestTrip?.generated.points[latestTrip.generated.points.length - 1]

    const isOffline = vehicle.status === 'offline'
    const lastSeenAt = isOffline
      ? new Date(Date.now() - randomBetween(3, 30) * 3_600_000).toISOString()
      : lastPoint?.ts ?? new Date().toISOString()

    await supabase
      .from('vehicles')
      .update({
        odometer_km: finalOdometer,
        fuel_level: state.fuelLevel !== null ? Math.round(state.fuelLevel * 10) / 10 : null,
        battery_level: state.batteryLevel !== null ? Math.round(state.batteryLevel * 10) / 10 : null,
        last_lat: lastPoint?.lat ?? null,
        last_lng: lastPoint?.lng ?? null,
        last_heading: lastPoint?.heading ?? 0,
        last_speed_kmh: isOffline ? 0 : lastPoint?.speed_kmh ?? 0,
        last_seen_at: lastSeenAt,
      })
      .eq('id', vehicle.id)

    // ── Alerts ──
    if (state.fuelLevel !== null && state.fuelLevel < 25) {
      alertRows.push({
        vehicle_id: vehicle.id,
        type: 'low_fuel',
        severity: state.fuelLevel < 12 ? 'critical' : 'high',
        message: `Fuel at ${Math.round(state.fuelLevel)}% — refuel before next dispatch.`,
      })
    }
    if (state.batteryLevel !== null && state.batteryLevel < 25) {
      alertRows.push({
        vehicle_id: vehicle.id,
        type: 'low_battery',
        severity: state.batteryLevel < 12 ? 'critical' : 'high',
        message: `Battery at ${Math.round(state.batteryLevel)}% — schedule a charging stop.`,
      })
    }
    if (latestTrip && latestTrip.generated.summary.overspeed_events > 0) {
      alertRows.push({
        vehicle_id: vehicle.id,
        trip_id: latestTripId,
        type: 'overspeed',
        severity: latestTrip.generated.summary.overspeed_events >= 3 ? 'high' : 'medium',
        message: `${latestTrip.generated.summary.overspeed_events} overspeeding event(s) on the most recent trip (limit 60 km/h).`,
      })
    }
    if (
      latestTrip &&
      latestTrip.generated.summary.duration_sec > 600 &&
      latestTrip.generated.summary.idle_time_sec / latestTrip.generated.summary.duration_sec > 0.25
    ) {
      alertRows.push({
        vehicle_id: vehicle.id,
        trip_id: latestTripId,
        type: 'idle',
        severity: 'medium',
        message: `Idle time made up ${Math.round(
          (latestTrip.generated.summary.idle_time_sec / latestTrip.generated.summary.duration_sec) * 100,
        )}% of the most recent trip.`,
      })
    }
    if (isOffline) {
      const hours = Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 3_600_000)
      alertRows.push({
        vehicle_id: vehicle.id,
        type: 'offline',
        severity: 'critical',
        message: `No telemetry received for ${hours}h.`,
      })
    }

    // ── Maintenance logs ──
    const services =
      vehicle.vehicle_type === 'bike'
        ? [
            { type: 'Tyre & Chain Service', intervalKm: 3000 },
            { type: 'Battery / Engine Checkup', intervalKm: 6000 },
          ]
        : [
            { type: 'Oil Change', intervalKm: 5000 },
            { type: 'Brake Inspection', intervalKm: 10000 },
          ]

    for (const svc of services) {
      const lastServiceKm = Math.max(0, finalOdometer - randomInt(500, svc.intervalKm + 800))
      const lastServiceDate = new Date(Date.now() - randomBetween(5, 85) * 86_400_000)
      const nextDueKm = lastServiceKm + svc.intervalKm
      const nextDueDate = new Date(lastServiceDate.getTime() + 120 * 86_400_000)

      const status = finalOdometer >= nextDueKm ? 'overdue' : finalOdometer >= nextDueKm - 500 ? 'due_soon' : 'ok'

      maintenanceRows.push({
        vehicle_id: vehicle.id,
        service_type: svc.type,
        last_service_km: Math.round(lastServiceKm),
        last_service_date: lastServiceDate.toISOString().slice(0, 10),
        next_due_km: Math.round(nextDueKm),
        next_due_date: nextDueDate.toISOString().slice(0, 10),
        status,
      })

      if (status !== 'ok') {
        alertRows.push({
          vehicle_id: vehicle.id,
          type: 'maintenance_due',
          severity: status === 'overdue' ? 'critical' : 'medium',
          message:
            status === 'overdue'
              ? `${svc.type} is overdue by ${Math.round(finalOdometer - nextDueKm)} km.`
              : `${svc.type} due within the next ${Math.round(nextDueKm - finalOdometer)} km.`,
        })
      }
    }
  }

  if (maintenanceRows.length > 0) {
    const { error } = await supabase.from('maintenance_logs').insert(maintenanceRows)
    if (error) throw error
  }
  if (alertRows.length > 0) {
    for (const batch of chunk(alertRows, 200)) {
      const { error } = await supabase.from('alerts').insert(batch)
      if (error) throw error
    }
  }

  return { alertCount: alertRows.length, maintenanceCount: maintenanceRows.length }
}

async function main() {
  console.log('\nFleetPulse — seeding Supabase backend\n' + '='.repeat(40))

  await resetTables()
  await ensureDemoUser()
  const drivers = await seedDrivers()
  const vehicles = await seedVehicles(drivers)
  await seedGeofences()
  const { runtimeStates, tripMetaById } = await seedTripsForFleet(vehicles)
  const { alertCount, maintenanceCount } = await finalizeVehiclesAndAlerts(vehicles, runtimeStates, tripMetaById)

  console.log('\n' + '='.repeat(40))
  console.log('Seed complete.')
  console.log(`  Drivers:     ${drivers.length}`)
  console.log(`  Vehicles:    ${vehicles.length}`)
  console.log(`  Trips:       ${tripMetaById.size}`)
  console.log(`  Alerts:      ${alertCount}`)
  console.log(`  Maintenance: ${maintenanceCount}`)
  console.log('\nDemo login:')
  console.log(`  Email:    ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
  console.log('\nStart the app with `npm run dev` and sign in with the credentials above.\n')
}

main().catch((err) => {
  console.error('\nSeed failed:', err)
  process.exit(1)
})
