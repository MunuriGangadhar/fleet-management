import { motion } from 'framer-motion'
import { HEALTH_BAND_COLOR, HEALTH_BAND_LABEL, type HealthScoreBreakdown } from '@/lib/healthScore'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './AnimatedNumber'

export function HealthGauge({
  breakdown,
  size = 44,
  showLabel = true,
  className,
}: {
  breakdown: HealthScoreBreakdown
  size?: number
  showLabel?: boolean
  className?: string
}) {
  const color = HEALTH_BAND_COLOR[breakdown.band]
  const stroke = 4
  const radius = size / 2 - stroke
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - breakdown.score / 100)

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-muted)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">
          <AnimatedNumber value={breakdown.score} />
        </div>
      </div>
      {showLabel && (
        <div>
          <p className="text-xs font-medium" style={{ color }}>
            {HEALTH_BAND_LABEL[breakdown.band]}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)]">Health score</p>
        </div>
      )}
    </div>
  )
}
