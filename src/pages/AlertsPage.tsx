import { useMemo, useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAlerts, useResolveAlert } from '@/hooks/useAlerts'
import { useToast } from '@/components/ui/Toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ALERT_SEVERITY_COLOR, ALERT_TYPE_LABEL } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AlertSeverity, AlertType } from '@/types/database'

const SEVERITIES: AlertSeverity[] = ['critical', 'high', 'medium', 'low']

export default function AlertsPage() {
  usePageTitle('Alerts', 'Everything that currently needs operator attention')

  const [includeResolved, setIncludeResolved] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(null)
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all')

  const { data: alerts, isLoading } = useAlerts({ includeResolved })
  const resolveAlert = useResolveAlert()
  const pushToast = useToast()

  const filtered = useMemo(() => {
    let list = alerts ?? []
    if (severityFilter) list = list.filter((a) => a.severity === severityFilter)
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter)
    return list
  }, [alerts, severityFilter, typeFilter])

  const types = Object.keys(ALERT_TYPE_LABEL) as AlertType[]

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
              severityFilter === s
                ? 'border-transparent text-white'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
            )}
            style={severityFilter === s ? { backgroundColor: ALERT_SEVERITY_COLOR[s] } : undefined}
          >
            {s}
          </button>
        ))}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
          className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)]"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {ALERT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>

        <label className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Show resolved
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldCheck size={28} />}
            title="No alerts match these filters"
            description="Adjust the filters above, or check back later."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card key={alert.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge color={ALERT_SEVERITY_COLOR[alert.severity]}>{alert.severity}</Badge>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {ALERT_TYPE_LABEL[alert.type]}
                  </span>
                  {alert.is_resolved && <Badge color="var(--text-tertiary)">Resolved</Badge>}
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{alert.message}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {alert.vehicle ? (
                    <Link to={`/vehicles/${alert.vehicle.id}`} className="hover:text-[var(--accent)]">
                      {alert.vehicle.registration_number}
                    </Link>
                  ) : (
                    'Unknown vehicle'
                  )}{' '}
                  · raised {formatRelativeTime(alert.created_at)}
                  {alert.resolved_at && ` · resolved ${formatRelativeTime(alert.resolved_at)}`}
                </p>
              </div>
              {!alert.is_resolved && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Check size={13} />}
                  onClick={() =>
                    resolveAlert.mutate(alert.id, {
                      onSuccess: () => pushToast('success', 'Alert resolved'),
                      onError: () => pushToast('error', 'Failed to resolve alert'),
                    })
                  }
                  className="shrink-0"
                >
                  Resolve
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
