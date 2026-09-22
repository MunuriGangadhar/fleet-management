import { useEffect, useState } from 'react'
import { Moon, Sun, Radio, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useLiveSimulation } from '@/hooks/useLiveSimulation'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme, toggle } = useTheme()
  const { profile, user, signOut } = useAuth()
  const sim = useLiveSimulation()
  const pushToast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (sim.error) pushToast('error', `Live simulation stopped: ${sim.error}`)
  }, [sim.error, pushToast])

  const displayName = profile?.full_name ?? user?.email ?? 'Operator'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5">
      <div>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={sim.toggle}
          title="Simulates live vehicle movement via a Supabase RPC + Realtime, so the map updates without a refresh."
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            sim.isRunning
              ? 'border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]'
              : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
          )}
        >
          <Radio size={13} className={sim.isRunning ? 'animate-pulse' : ''} />
          {sim.isRunning ? 'Live simulation on' : 'Live simulation off'}
        </button>

        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--bg-muted)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden text-[var(--text-primary)] sm:inline">{displayName}</span>
            <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-raised)] p-1 shadow-lg animate-fade-in">
                <div className="px-3 py-2 text-xs text-[var(--text-tertiary)]">
                  Signed in as
                  <p className="truncate text-[var(--text-primary)]">{user?.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
