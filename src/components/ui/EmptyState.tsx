import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 text-[var(--text-tertiary)]">{icon}</div>}
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description && <p className="max-w-xs text-xs text-[var(--text-tertiary)]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
