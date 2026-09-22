import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bell, Users, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/drivers', label: 'Drivers', icon: Users },
]

export function Sidebar() {
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
      </nav>

      <div className="mt-auto px-5 py-4 text-[11px] text-[var(--text-tertiary)]">
        <p>Fleet Ops Prototype</p>
        <p>Bengaluru region · demo data</p>
      </div>
    </aside>
  )
}
