import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAlerts, useResolveAlert } from '@/hooks/useAlerts'
import { useToast } from '@/components/ui/Toast'
import { ALERT_SEVERITY_COLOR, ALERT_TYPE_LABEL } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'

export function AlertsFeed({
  limit = 6,
  vehicleId,
  showViewAll = true,
}: {
  limit?: number
  vehicleId?: string
  showViewAll?: boolean
}) {
  const { data: alerts, isLoading } = useAlerts({ vehicleId })
  const resolveAlert = useResolveAlert()
  const pushToast = useToast()

  const visible = (alerts ?? []).slice(0, limit)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Open alerts"
        subtitle={alerts ? `${alerts.length} require review` : undefined}
        action={
          showViewAll ? (
            <Link to="/alerts" className="text-xs font-medium text-[var(--accent)]">
              View all
            </Link>
          ) : undefined
        }
      />
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {isLoading && <p className="px-2 text-xs text-[var(--text-tertiary)]">Loading...</p>}

        {!isLoading && visible.length === 0 && (
          <EmptyState
            icon={<ShieldCheck size={28} />}
            title="All clear"
            description="No open alerts across the fleet right now."
          />
        )}

        <AnimatePresence initial={false}>
          {visible.map((alert, index) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
              className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge color={ALERT_SEVERITY_COLOR[alert.severity]}>{alert.severity}</Badge>
                  <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {ALERT_TYPE_LABEL[alert.type]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{alert.message}</p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  {alert.vehicle?.registration_number ?? 'Unknown vehicle'} ·{' '}
                  {formatRelativeTime(alert.created_at)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon={<Check size={13} />}
                onClick={() => {
                  resolveAlert.mutate(alert.id, {
                    onSuccess: () => pushToast('success', 'Alert resolved'),
                    onError: () => pushToast('error', 'Failed to resolve alert'),
                  })
                }}
                className="shrink-0"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  )
}
