import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  color?: string
  variant?: 'solid' | 'soft'
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
}

export function Badge({
  children,
  color = 'var(--text-secondary)',
  variant = 'soft',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-medium whitespace-nowrap',
        SIZE_CLASSES[size],
        className,
      )}
      style={
        variant === 'soft'
          ? { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }
          : { backgroundColor: color, color: 'white' }
      }
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  )
}
