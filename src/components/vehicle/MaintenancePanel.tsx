import { Wrench } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatOdometer } from '@/lib/utils'
import { format } from 'date-fns'
import type { MaintenanceLogRow, MaintenanceStatus } from '@/types/database'

const STATUS_COLOR: Record<MaintenanceStatus, string> = {
  ok: 'var(--success)',
  due_soon: 'var(--warning)',
  overdue: 'var(--danger)',
}

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  ok: 'Up to date',
  due_soon: 'Due soon',
  overdue: 'Overdue',
}

export function MaintenancePanel({ logs }: { logs: MaintenanceLogRow[] }) {
  return (
    <Card>
      <CardHeader title="Maintenance" subtitle="Predicted from odometer & service intervals" />
      <div className="divide-y divide-[var(--border-subtle)]">
        {logs.length === 0 && (
          <EmptyState icon={<Wrench size={24} />} title="No maintenance records" />
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{log.service_type}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Last service: {format(new Date(log.last_service_date), 'dd MMM yyyy')} ·{' '}
                {formatOdometer(log.last_service_km)}
              </p>
            </div>
            <div className="text-right">
              <Badge color={STATUS_COLOR[log.status]}>{STATUS_LABEL[log.status]}</Badge>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                Next due: {formatOdometer(log.next_due_km)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
