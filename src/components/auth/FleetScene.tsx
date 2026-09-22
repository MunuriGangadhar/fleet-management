import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Blip {
  id: number
  x: number
  y: number
  depth: number
  delay: number
  size: number
}

// Deterministic pseudo-random layout so the scene doesn't reshuffle on
// every re-render/HMR — a fixed seed of "vehicle" blips scattered across
// the 3D floor grid at varying depths.
const BLIPS: Blip[] = Array.from({ length: 22 }, (_, i) => {
  const seed = Math.sin(i * 12.9898) * 43758.5453
  const frac = seed - Math.floor(seed)
  const seed2 = Math.sin(i * 78.233) * 12543.912
  const frac2 = seed2 - Math.floor(seed2)
  return {
    id: i,
    x: frac * 100,
    y: 10 + frac2 * 80,
    depth: 40 + frac * 220,
    delay: frac2 * 4,
    size: 4 + frac * 5,
  }
})

/**
 * A GPU-accelerated, pure-CSS 3D scene for the login screen: a perspective
 * floor grid with parallax that follows the cursor, plus floating vehicle
 * "blips" drifting at different depths. Deliberately not a real 3D engine
 * (react-three-fiber pulls in Three.js and currently conflicts with React
 * 19.3 peer ranges) — CSS transforms give the same visual payoff for a
 * decorative surface at a fraction of the bundle cost.
 */
export function FleetScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 })

  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10])
  const gridShiftX = useTransform(springX, [-0.5, 0.5], [-14, 14])
  const gridShiftY = useTransform(springY, [-0.5, 0.5], [-14, 14])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: 1200 }}
    >
      {/* ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="absolute inset-0"
      >
        {/* perspective floor grid, tilted back in 3D space */}
        <motion.div
          className="absolute left-1/2 top-[58%] h-[140%] w-[220%] -translate-x-1/2"
          style={{
            x: gridShiftX,
            y: gridShiftY,
            transform: 'rotateX(62deg) translateZ(-60px)',
            transformStyle: 'preserve-3d',
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--accent) 35%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--accent) 35%, transparent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 10%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 30%, black 10%, transparent 75%)',
          }}
        />

        {/* floating vehicle blips at varying depths */}
        {BLIPS.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              translateZ: b.depth,
              backgroundColor: 'var(--accent)',
              boxShadow: '0 0 10px 2px color-mix(in srgb, var(--accent) 70%, transparent)',
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.25, 0.9, 0.25],
            }}
            transition={{
              duration: 3.5 + (b.id % 4),
              delay: b.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* vignette so the login card stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-canvas)]" />
    </div>
  )
}
