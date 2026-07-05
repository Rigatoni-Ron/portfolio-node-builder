import { motion } from 'motion/react'
import { useMeasure } from '../lib/useMeasure'

// Animates container height to follow its content: the inner div is
// measured, the outer motion.div chases the measured height. Never attach
// both to the same element (measurement loop).
//
// Overflow is clipped at all times. New content lays out one frame before
// the height animation starts, so without a permanent clip it would spill
// past the container and flash on screen before the container grows. Any
// popover that must escape the node (the ticker dropdown) is portaled out.
export function AnimatedHeight({ children }: { children: React.ReactNode }) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()

  return (
    <motion.div
      className="overflow-hidden"
      initial={false}
      // height is 0 before the first measurement — render auto until then
      animate={bounds.height > 0 ? { height: bounds.height } : undefined}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  )
}
