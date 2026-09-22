import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

export function MetricCard({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1.5 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">{value}</p>
    </Card>
  )
}
