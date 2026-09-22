import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useTilt } from '@/hooks/useTilt'
import { AnimatedNumber } from './AnimatedNumber'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  icon?: ReactNode
  accent?: string
  trend?: string
  onClick?: () => void
  active?: boolean
}

export function StatCard({ label, value, icon, accent, trend, onClick, active }: StatCardProps) {
  const tilt = useTilt(6)

  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      {...tilt.handlers}
      style={tilt.style}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5 shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-lg',
        active && 'ring-2 ring-[var(--accent)]',
      )}
    >
      {icon && (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent ?? 'var(--accent)'} 14%, transparent)`,
            color: accent ?? 'var(--accent)',
          }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-tertiary)]">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber
            value={value}
            className="text-xl font-semibold text-[var(--text-primary)] tabular-nums"
          />
          {trend && <span className="text-xs text-[var(--text-tertiary)]">{trend}</span>}
        </div>
      </div>
    </motion.div>
  )
}
