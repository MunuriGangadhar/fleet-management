import { useMotionValue, useSpring } from 'framer-motion'
import type { MouseEvent } from 'react'

/**
 * Cursor-driven 3D tilt for a card — rotateX/rotateY spring toward the
 * pointer position within the element and spring back to flat on leave.
 * Pure CSS transform under the hood (GPU-accelerated), no 3D scene graph.
 */
export function useTilt(maxDegrees = 8) {
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springConfig = { stiffness: 280, damping: 22, mass: 0.6 }
  const springX = useSpring(rotateX, springConfig)
  const springY = useSpring(rotateY, springConfig)

  function onMouseMove(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * maxDegrees)
    rotateX.set(py * -maxDegrees)
  }

  function onMouseLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return {
    style: { rotateX: springX, rotateY: springY, transformPerspective: 700 },
    handlers: { onMouseMove, onMouseLeave },
  }
}
