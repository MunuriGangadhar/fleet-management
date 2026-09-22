import { useMemo, useState } from 'react'
import { Check, X, ShieldOff, ShieldCheck, Shield, User as UserIcon } from 'lucide-react'
import { useAllProfiles, useUpdateProfile } from '@/hooks/useProfiles'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ProfileRow, UserStatus } from '@/types/database'

const STATUS_COLOR: Record<UserStatus, string> = {
  pending: 'var(--warning)',
  active: 'var(--success)',
  rejected: 'var(--danger)',
  suspended: 'var(--danger)',
}

const TABS: { key: UserStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
]

export default function AdminUsersPage() {
  usePageTitle('Admin · Users', 'Approve signups and manage operator access')

  const { data: profiles, isLoading } = useAllProfiles()
  const updateProfile = useUpdateProfile()
  const pushToast = useToast()
  const { user: currentUser } = useAuth()

  const [tab, setTab] = useState<UserStatus>('pending')

  const counts = useMemo(() => {
    const c: Record<UserStatus, number> = { pending: 0, active: 0, rejected: 0, suspended: 0 }
    for (const p of profiles ?? []) c[p.status] += 1
    return c
  }, [profiles])

  const visible = (profiles ?? []).filter((p) => p.status === tab)

  function act(
    id: string,
    patch: Omit<Parameters<typeof updateProfile.mutate>[0], 'id'>,
    successMsg: string,
  ) {
    updateProfile.mutate(
      { id, ...patch },
      {
        onSuccess: () => pushToast('success', successMsg),
        onError: (err) => pushToast('error', err instanceof Error ? err.message : 'Update failed'),
      },
    )
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.key
                ? 'border-transparent bg-[var(--accent)] text-white'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span
                className={cn(
                  'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                  tab === t.key ? 'bg-white/25 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UserIcon size={26} />}
            title={`No ${tab} accounts`}
            description={
              tab === 'pending'
                ? 'New signups will show up here for approval.'
                : `No accounts currently have ${tab} status.`
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <UserRow
              key={p.id}
              profile={p}
              isSelf={p.id === currentUser?.id}
              onApprove={() => act(p.id, { status: 'active' }, `${p.full_name} approved`)}
              onReject={() => act(p.id, { status: 'rejected' }, `${p.full_name} rejected`)}
              onSuspend={() => act(p.id, { status: 'suspended' }, `${p.full_name} suspended`)}
              onReactivate={() => act(p.id, { status: 'active' }, `${p.full_name} reactivated`)}
              onToggleRole={() =>
                act(
                  p.id,
                  { role: p.role === 'admin' ? 'operator' : 'admin' },
                  `${p.full_name} is now ${p.role === 'admin' ? 'an operator' : 'an admin'}`,
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UserRow({
  profile,
  isSelf,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onToggleRole,
}: {
  profile: ProfileRow
  isSelf: boolean
  onApprove: () => void
  onReject: () => void
  onSuspend: () => void
  onReactivate: () => void
  onToggleRole: () => void
}) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {profile.full_name}
          </p>
          <Badge color={profile.role === 'admin' ? 'var(--accent)' : 'var(--text-tertiary)'}>
            {profile.role}
          </Badge>
          <Badge color={STATUS_COLOR[profile.status]}>{profile.status}</Badge>
          {isSelf && <Badge color="var(--info)">You</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
          {profile.email ?? 'No email on file'} · joined {formatRelativeTime(profile.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {profile.status === 'pending' && (
          <>
            <Button size="sm" variant="primary" icon={<Check size={13} />} onClick={onApprove}>
              Approve
            </Button>
            <Button size="sm" variant="danger" icon={<X size={13} />} onClick={onReject}>
              Reject
            </Button>
          </>
        )}

        {profile.status === 'active' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={profile.role === 'admin' ? <UserIcon size={13} /> : <Shield size={13} />}
              onClick={onToggleRole}
              disabled={isSelf}
              title={isSelf ? "You can't change your own role" : undefined}
            >
              {profile.role === 'admin' ? 'Make operator' : 'Make admin'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<ShieldOff size={13} />}
              onClick={onSuspend}
              disabled={isSelf}
              title={isSelf ? "You can't suspend your own account" : undefined}
            >
              Suspend
            </Button>
          </>
        )}

        {(profile.status === 'suspended' || profile.status === 'rejected') && (
          <Button size="sm" variant="primary" icon={<ShieldCheck size={13} />} onClick={onReactivate}>
            Reactivate
          </Button>
        )}
      </div>
    </Card>
  )
}
