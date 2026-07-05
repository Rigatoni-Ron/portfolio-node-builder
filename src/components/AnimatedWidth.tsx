import { useState } from 'react'
import { motion } from 'motion/react'
import { useMeasure } from '../lib/useMeasure'

// Width counterpart of AnimatedHeight — for containers whose content
// changes horizontally, like buttons with swapping labels. The inner div
// sizes to its content (w-max) and gets measured; the outer motion.div
// chases the measured width.
export function AnimatedWidth({ children }: { children: React.ReactNode }) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()
  const [animating, setAnimating] = useState(false)

  return (
    <motion.div
      className={animating ? 'overflow-hidden' : undefined}
      initial={false}
      animate={bounds.width > 0 ? { width: bounds.width } : undefined}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
      onAnimationStart={() => setAnimating(true)}
      onAnimationComplete={() => setAnimating(false)}
    >
      <div ref={ref} className="w-max">
        {children}
      </div>
    </motion.div>
  )
}
