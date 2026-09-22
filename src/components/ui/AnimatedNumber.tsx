import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

export function AnimatedNumber({
  value,
  className,
  format,
}: {
  value: number
  className?: string
  format?: (v: number) => string
}) {
  const motionValue = useMotionValue(value)
  const display = useTransform(motionValue, (v) =>
    format ? format(Math.round(v)) : Math.round(v).toLocaleString('en-IN'),
  )

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [value, motionValue])

  return <motion.span className={className}>{display}</motion.span>
}
