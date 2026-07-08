import { useEffect, useState } from 'react'
import { useReactFlow, useStore } from '@xyflow/react'
import { X } from 'lucide-react'
import { useGraphStore } from '../store/graphStore'
import { nodeSize } from '../lib/placement'
import type { AppNode } from '../lib/types'

const SEEN_KEY = 'pnb:intro-done'

const STEPS: {
  type: AppNode['type'] | null
  title: string
  body: string
}[] = [
  {
    type: null,
    title: 'Welcome to Portfolio Node Builder',
    body: 'Build a portfolio by wiring nodes together. Here is a quick tour.',
  },
  {
    type: 'stock',
    title: 'Asset',
    body: 'Pick a stock, ETF, or crypto. Set how much to invest.',
  },
  {
    type: 'earn',
    title: 'Earn',
    body: 'Optional: add yield on top of an asset. Or just hold.',
  },
  {
    type: 'timeline',
    title: 'Timeline',
    body: 'Choose a time window. Backtest the past or project forward.',
  },
  {
    type: 'portfolio',
    title: 'Portfolio',
    body: 'The result: growth chart, holdings, and totals.',
  },
]

// One-time onboarding: a popover walks through each node type, panning to
// and highlighting the matching node. Dismissal persists in localStorage.
export function IntroTour() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY)
    } catch {
      return false
    }
  })
  const [step, setStep] = useState(0)
  const { fitView } = useReactFlow()
  const [tx, ty, zoom] = useStore((s) => s.transform)
  const nodes = useGraphStore((s) => s.nodes)

  const current = STEPS[step]
  const target = current.type
    ? nodes.find((n) => n.type === current.type && !n.parentId)
    : undefined

  useEffect(() => {
    if (!visible || !target) return
    fitView({ nodes: [{ id: target.id }], padding: 0.6, duration: 400, maxZoom: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visible])

  if (!visible) return null

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* private mode — just close */
    }
    setVisible(false)
  }
  const next = () => (step >= STEPS.length - 1 ? dismiss() : setStep(step + 1))

  // Screen-space rect of the highlighted node, tracking pan/zoom live
  const rect = target
    ? (() => {
        const size = nodeSize(target)
        return {
          left: tx + target.position.x * zoom,
          top: ty + target.position.y * zoom,
          width: size.width * zoom,
          height: size.height * zoom,
        }
      })()
    : null

  const POP_W = 264
  const popStyle: React.CSSProperties = rect
    ? (() => {
        const rightX = rect.left + rect.width + 16
        const fitsRight = rightX + POP_W < window.innerWidth - 16
        return {
          left: fitsRight ? rightX : Math.max(16, rect.left - POP_W - 16),
          top: Math.min(Math.max(rect.top, 16), window.innerHeight - 220),
          width: POP_W,
        }
      })()
    : { left: '50%', top: '30%', transform: 'translateX(-50%)', width: 300 }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {rect && (
        <div
          className="absolute rounded-2xl border-2 border-accent transition-all duration-300 ease-out"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)',
          }}
        />
      )}

      <div
        className="pointer-events-auto absolute rounded-xl border border-border bg-surface p-4 shadow-xl"
        style={popStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-medium text-text">
            {current.title}
          </span>
          <button
            onClick={dismiss}
            aria-label="Close intro"
            className="-m-1 rounded p-1 text-text-muted transition-colors hover:text-text"
          >
            <X size={14} />
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-text-muted">
          {current.body}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">
            {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={next}
            className="rounded-full bg-accent/20 px-3 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/30"
          >
            {step === STEPS.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
