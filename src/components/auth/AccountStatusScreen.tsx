import { Clock, ShieldX, ShieldAlert, ShieldQuestion, Truck, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import type { ProfileRow } from '@/types/database'

const CONTENT: Record<
  Exclude<ProfileRow['status'], 'active'>,
  { icon: typeof Clock; title: string; body: string; color: string }
> = {
  pending: {
    icon: Clock,
    title: 'Your account is pending approval',
    body: 'An administrator needs to approve your account before you can see any fleet data. This is usually quick — try checking back shortly, or ask an admin to approve you from the Admin panel.',
    color: 'var(--warning)',
  },
  rejected: {
    icon: ShieldX,
    title: 'Access request declined',
    body: "An administrator has declined this account's access request. If you think this is a mistake, contact your fleet operations admin.",
    color: 'var(--danger)',
  },
  suspended: {
    icon: ShieldAlert,
    title: 'Account suspended',
    body: 'This account has been suspended by an administrator. Contact your fleet operations admin if you believe this is an error.',
    color: 'var(--danger)',
  },
}

const FALLBACK = {
  icon: ShieldQuestion,
  title: "Your account isn't active yet",
  body: 'Something about your account access needs an administrator to look at it. Contact your fleet operations admin.',
  color: 'var(--warning)',
}

export function AccountStatusScreen({ profile }: { profile: ProfileRow }) {
  const { signOut } = useAuth()
  const info = CONTENT[profile.status as Exclude<ProfileRow['status'], 'active'>] ?? FALLBACK
  const Icon = info.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center shadow-lg">
        <div className="mb-4 flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <Truck size={22} />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">FleetPulse</span>
        </div>

        <Icon size={30} style={{ color: info.color }} className="mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-primary)]">{info.title}</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-tertiary)]">{info.body}</p>

        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Signed in as <span className="text-[var(--text-secondary)]">{profile.email}</span>
        </p>

        <Button
          variant="secondary"
          size="sm"
          icon={<LogOut size={13} />}
          onClick={() => signOut()}
          className="mt-4 w-full"
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
