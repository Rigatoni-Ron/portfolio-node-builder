import { useState } from 'react'
import { motion } from 'motion/react'
import { useMeasure } from '../lib/useMeasure'

// Animates container height to follow its content: the inner div is
// measured, the outer motion.div chases the measured height. Never attach
// both to the same element (measurement loop).
//
// Overflow is only clipped while the height is actually animating, so
// popovers inside (e.g. the ticker dropdown) stay visible at rest.
export function AnimatedHeight({ children }: { children: React.ReactNode }) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()
  const [animating, setAnimating] = useState(false)

  return (
    <motion.div
      className={animating ? 'overflow-hidden' : undefined}
      initial={false}
      // height is 0 before the first measurement — render auto until then
      animate={bounds.height > 0 ? { height: bounds.height } : undefined}
      transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
      onAnimationStart={() => setAnimating(true)}
      onAnimationComplete={() => setAnimating(false)}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  )
}
