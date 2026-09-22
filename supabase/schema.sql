-- ============================================================================
-- FleetPulse — Supabase schema
--
-- Run this whole file once in Supabase Dashboard → SQL Editor → New query.
-- It is idempotent-ish (uses IF NOT EXISTS / OR REPLACE) so re-running it
-- after a partial failure — or after pulling an update to this file — is
-- safe, EXCEPT for the CREATE POLICY statements — Postgres has no "CREATE
-- POLICY IF NOT EXISTS", so they DROP POLICY IF EXISTS first.
--
-- Sections:
--   1. Extensions
--   2. Tables
--   3. Indexes
--   4. New-user → profile trigger (self-signups start pending + operator)
--   5. Role & approval helper functions (is_active_user, is_admin)
--   6. Row Level Security policies
--   7. Realtime publication
--   8. Live-simulation RPC (used by the "Live simulation" toggle in the UI)
--   9. Aggregation views
-- ============================================================================

-- ── 1. Extensions ───────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── 2. Tables ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Operator',
  email text,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'suspended')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Migrating an existing project (profiles already had role/full_name but not
-- email/status): these are no-ops on a fresh install, and safely backfill
-- existing rows to 'pending' on an upgrade — see scripts/seed.ts, which
-- promotes the demo account to an active admin right after seeding, solving
-- the bootstrap problem of "no admin exists yet to approve anyone".
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists status text not null default 'pending';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles
      add constraint profiles_status_check check (status in ('pending', 'active', 'rejected', 'suspended'));
  end if;
end $$;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  license_number text not null unique,
  status text not null default 'active' check (status in ('active', 'on_leave', 'inactive')),
  rating numeric(2, 1) not null default 4.5 check (rating between 0 and 5),
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  name text not null,
  make text not null,
  model text not null,
  vehicle_type text not null check (vehicle_type in ('truck', 'van', 'car', 'bike')),
  status text not null default 'idle' check (status in ('active', 'idle', 'maintenance', 'offline')),
  driver_id uuid references public.drivers (id) on delete set null,
  fuel_level numeric(5, 2) check (fuel_level between 0 and 100),
  battery_level numeric(5, 2) check (battery_level between 0 and 100),
  ignition_state boolean not null default false,
  odometer_km numeric(10, 1) not null default 0,
  last_lat double precision,
  last_lng double precision,
  last_heading numeric(5, 1) default 0,
  last_speed_kmh numeric(5, 1) default 0,
  last_seen_at timestamptz,
  health_score int not null default 100 check (health_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.geofences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('depot', 'customer', 'restricted')),
  center_lat double precision not null,
  center_lng double precision not null,
  radius_m int not null default 300,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  status text not null default 'completed' check (status in ('ongoing', 'completed')),
  start_time timestamptz not null,
  end_time timestamptz,
  start_lat double precision not null,
  start_lng double precision not null,
  end_lat double precision,
  end_lng double precision,
  start_address text not null,
  end_address text,
  distance_km numeric(7, 2) not null default 0,
  duration_sec int not null default 0,
  avg_speed_kmh numeric(5, 1) not null default 0,
  max_speed_kmh numeric(5, 1) not null default 0,
  idle_time_sec int not null default 0,
  halt_count int not null default 0,
  overspeed_events int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_points (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips (id) on delete cascade,
  ts timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  speed_kmh numeric(5, 1) not null default 0,
  heading numeric(5, 1) not null default 0
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  type text not null check (
    type in ('overspeed', 'idle', 'maintenance_due', 'offline', 'low_fuel', 'low_battery')
  ),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  message text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  service_type text not null,
  last_service_km numeric(10, 1) not null,
  last_service_date date not null,
  next_due_km numeric(10, 1) not null,
  next_due_date date not null,
  status text not null default 'ok' check (status in ('ok', 'due_soon', 'overdue'))
);

-- ── 3. Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_vehicles_status on public.vehicles (status);
create index if not exists idx_vehicles_driver on public.vehicles (driver_id);
create index if not exists idx_trips_vehicle on public.trips (vehicle_id, start_time desc);
create index if not exists idx_trips_driver on public.trips (driver_id);
create index if not exists idx_trip_points_trip on public.trip_points (trip_id, ts);
create index if not exists idx_alerts_vehicle on public.alerts (vehicle_id);
create index if not exists idx_alerts_open on public.alerts (is_resolved, severity);
create index if not exists idx_maintenance_vehicle on public.maintenance_logs (vehicle_id);
create index if not exists idx_profiles_status on public.profiles (status);

-- ── 4. New-user → profile trigger ────────────────────────────────────────────
-- Every Supabase Auth user automatically gets a row in `profiles`. Self-
-- signups (src/pages/SignupPage.tsx, using the public anon key) always land
-- as role='operator', status='pending' — role/status are hard-coded here,
-- NEVER read from new.raw_user_meta_data, because that JSON is client-
-- supplied at signUp() time: trusting a client-sent "role":"admin" would be
-- an instant privilege-escalation hole. The only way to become active/admin
-- is an explicit UPDATE by an existing admin (via the Admin panel) or by the
-- service-role seed script (scripts/seed.ts bootstraps the first admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'operator',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 5. Role & approval helper functions ──────────────────────────────────────
-- SECURITY DEFINER so these can read `profiles` (to check the CALLING user's
-- own role/status) without recursing back through the RLS policies that use
-- them below — the classic gotcha with checking role via a plain subquery
-- against a table that itself has RLS enabled.
create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active' and role = 'admin'
  );
$$;

-- ── 6. Row Level Security ────────────────────────────────────────────────────
-- Product decision: this is a single-tenant internal ops tool, not a
-- multi-customer SaaS, so there's no per-row customer isolation to worry
-- about — but access is now gated on account approval. Every fleet-data
-- SELECT policy below requires is_active_user(): a signed-up-but-not-yet-
-- approved (or rejected/suspended) account has a valid Supabase session but
-- sees nothing until an admin approves it. Writes stay locked down to the
-- service role (scripts/seed.ts) except the three actions the UI performs
-- as a signed-in user: resolving an alert, the live-simulation RPC, and an
-- admin managing other users' role/status.

alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.geofences enable row level security;
alter table public.trips enable row level security;
alter table public.trip_points enable row level security;
alter table public.alerts enable row level security;
alter table public.maintenance_logs enable row level security;

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Admins can see and manage every account (approve signups, change roles,
-- suspend/reject). Both policies OR with the "own profile" ones above, so a
-- non-admin still only ever sees their own row.
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update all profiles" on public.profiles;
create policy "admins update all profiles" on public.profiles
  for update to authenticated using (public.is_admin());

drop policy if exists "drivers read" on public.drivers;
create policy "drivers read" on public.drivers
  for select to authenticated using (public.is_active_user());

drop policy if exists "vehicles read" on public.vehicles;
create policy "vehicles read" on public.vehicles
  for select to authenticated using (public.is_active_user());

drop policy if exists "geofences read" on public.geofences;
create policy "geofences read" on public.geofences
  for select to authenticated using (public.is_active_user());

drop policy if exists "trips read" on public.trips;
create policy "trips read" on public.trips
  for select to authenticated using (public.is_active_user());

drop policy if exists "trip points read" on public.trip_points;
create policy "trip points read" on public.trip_points
  for select to authenticated using (public.is_active_user());

drop policy if exists "maintenance read" on public.maintenance_logs;
create policy "maintenance read" on public.maintenance_logs
  for select to authenticated using (public.is_active_user());

drop policy if exists "alerts read" on public.alerts;
create policy "alerts read" on public.alerts
  for select to authenticated using (public.is_active_user());

-- The one write path a logged-in operator needs directly: marking an alert
-- resolved. (created_at / vehicle_id / severity etc. are untouched by the UI.)
drop policy if exists "alerts resolve" on public.alerts;
create policy "alerts resolve" on public.alerts
  for update to authenticated using (public.is_active_user()) with check (public.is_active_user());

-- ── 7. Realtime ──────────────────────────────────────────────────────────────
-- Lets every open browser tab receive live UPDATE events on `vehicles`
-- (see src/hooks/useRealtimeVehicles.ts). Safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vehicles'
  ) then
    alter publication supabase_realtime add table public.vehicles;
  end if;
end $$;

-- ── 8. Live-simulation RPC ───────────────────────────────────────────────────
-- Powers the "Live simulation" toggle in the topbar. It nudges a few active
-- vehicles a small step further along, decrements fuel/battery slightly, and
-- stamps last_seen_at — purely so the map visibly moves during a live demo
-- without needing a GPS feed, a cron job, or an edge function. Runs as
-- SECURITY DEFINER so authenticated users can trigger it without being
-- granted a blanket UPDATE on `vehicles`; it still checks is_active_user()
-- itself as defense in depth, since SECURITY DEFINER functions bypass RLS
-- entirely and a pending/suspended account could otherwise call the RPC
-- directly (bypassing the UI) and mutate fleet data despite having no read
-- access to it.
create or replace function public.advance_fleet_simulation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  jitter_lat double precision;
  jitter_lng double precision;
  new_speed numeric;
begin
  if not public.is_active_user() then
    return;
  end if;

  for v in
    select id, last_heading, fuel_level, battery_level
    from vehicles
    where status = 'active' and last_lat is not null and last_lng is not null
    order by random()
    limit 3
  loop
    jitter_lat := (random() - 0.5) * 0.004;
    jitter_lng := (random() - 0.5) * 0.004;
    new_speed := round((18 + random() * 55)::numeric, 1);

    update vehicles
    set
      last_lat = last_lat + jitter_lat,
      last_lng = last_lng + jitter_lng,
      last_heading = mod((coalesce(v.last_heading, 0) + (random() * 40 - 20))::int + 360, 360),
      last_speed_kmh = new_speed,
      last_seen_at = now(),
      fuel_level = case when v.fuel_level is not null
        then greatest(v.fuel_level - random() * 0.4, 4) else null end,
      battery_level = case when v.battery_level is not null
        then greatest(v.battery_level - random() * 0.3, 4) else null end,
      odometer_km = odometer_km + (new_speed * (4.0 / 3600))
    where id = v.id;
  end loop;
end;
$$;

grant execute on function public.advance_fleet_simulation() to authenticated;

-- ── 9. Aggregation views ─────────────────────────────────────────────────────
-- Pushes the "how many open alerts, of what severity, does this vehicle
-- have" and "how many trips / km / overspeed events has this driver
-- logged" aggregations into Postgres instead of shipping every alert/trip
-- row to the browser and reducing them client-side. Cheap at this fleet's
-- size either way, but this is the pattern that keeps working once the
-- fleet is 50x bigger.
--
-- `security_invoker = true` (Postgres 15+) makes the view enforce RLS as
-- the querying role, not the view owner — so these automatically inherit
-- the is_active_user() gate on `alerts`/`trips` above without any extra
-- guard here.
create or replace view public.vehicle_open_alert_summary
  with (security_invoker = true) as
select
  vehicle_id,
  count(*)::int as open_alert_count,
  max(
    case severity
      when 'critical' then 4
      when 'high' then 3
      when 'medium' then 2
      else 1
    end
  ) as highest_severity_rank
from public.alerts
where is_resolved = false
group by vehicle_id;

grant select on public.vehicle_open_alert_summary to authenticated;

create or replace view public.driver_trip_stats
  with (security_invoker = true) as
select
  driver_id,
  count(*)::int as trip_count,
  coalesce(sum(distance_km), 0)::numeric as total_distance_km,
  coalesce(sum(overspeed_events), 0)::int as overspeed_events
from public.trips
where driver_id is not null
group by driver_id;

grant select on public.driver_trip_stats to authenticated;
