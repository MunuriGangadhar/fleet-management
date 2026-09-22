import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bell, Users, Truck, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAllProfiles } from '@/hooks/useProfiles'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/drivers', label: 'Drivers', icon: Users },
]

export function Sidebar() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { data: profiles } = useAllProfiles({ enabled: isAdmin })
  const pendingCount = isAdmin ? (profiles ?? []).filter((p) => p.status === 'pending').length : 0

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
          <Truck size={17} />
        </div>
        <span className="text-base font-semibold text-[var(--text-primary)]">FleetPulse</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
              )
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
              )
            }
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck size={17} />
              Admin
            </span>
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </NavLink>
        )}
      </nav>

      <div className="mt-auto px-5 py-4 text-[11px] text-[var(--text-tertiary)]">
        <p>Fleet Ops Prototype</p>
        <p>Bengaluru region · demo data</p>
      </div>
    </aside>
  )
}
