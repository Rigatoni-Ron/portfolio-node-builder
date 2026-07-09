import { useEffect, useLayoutEffect, useState } from 'react'
import { useReactFlow, useStore } from '@xyflow/react'
import { X } from 'lucide-react'
import { useGraphStore } from '../store/graphStore'
import { nodeSize } from '../lib/placement'
import type { AppNode } from '../lib/types'

export const INTRO_SEEN_KEY = 'pnb:intro-done'

export function hasSeenIntro(): boolean {
  try {
    return !!localStorage.getItem(INTRO_SEEN_KEY)
  } catch {
    return true
  }
}

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

// --- Tour visibility helpers ------------------------------------------------
// The tour stages the graph: everything starts hidden, each step reveals the
// next node (and the wire connecting it to what's already visible). These
// flags are presentation-only — the store strips them from persistence.

function hideAll() {
  useGraphStore.setState((s) => ({
    nodes: s.nodes.map((n) => ({ ...n, hidden: true }) as AppNode),
    edges: s.edges.map((e) => ({ ...e, hidden: true })),
  }))
}

function revealType(type: NonNullable<AppNode['type']>) {
  useGraphStore.setState((s) => {
    const target = s.nodes.find((n) => n.type === type && !n.parentId)
    if (!target) return {}
    const visible = new Set(
      s.nodes.filter((n) => !n.hidden || n.id === target.id).map((n) => n.id),
    )
    return {
      nodes: s.nodes.map((n) =>
        n.id === target.id
          ? ({ ...n, hidden: false, className: 'node-enter' } as AppNode)
          : n,
      ),
      edges: s.edges.map((e) =>
        e.hidden && visible.has(e.source) && visible.has(e.target)
          ? { ...e, hidden: false, className: 'edge-enter' }
          : e,
      ),
    }
  })
}

function revealAll() {
  useGraphStore.setState((s) => ({
    nodes: s.nodes.map(
      ({ className: _c, ...n }) => ({ ...n, hidden: false }) as AppNode,
    ),
    edges: s.edges.map(({ className: _c, ...e }) => ({ ...e, hidden: false })),
  }))
}

// One-time onboarding: the canvas starts clean, and each step drops in the
// next node with its wire drawing in, spotlights it, and dims the rest.
// Dismissal reveals everything and persists in localStorage.
export function IntroTour() {
  const [visible, setVisible] = useState(() => {
    try {
      return !hasSeenIntro()
    } catch {
      return false
    }
  })
  const [step, setStep] = useState(0)
  const { fitView, setViewport } = useReactFlow()
  const [tx, ty, zoom] = useStore((s) => s.transform)
  const nodes = useGraphStore((s) => s.nodes)

  // Hide the graph before first paint so the welcome step sits on a clean canvas
  useLayoutEffect(() => {
    if (visible) hideAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Park the viewport where the first node will appear, so the first reveal
  // doesn't yank the camera across the canvas. Runs after React Flow has
  // initialized (setViewport is a no-op before that), hence the double rAF.
  useEffect(() => {
    if (!visible) return
    const firstType = STEPS.find((s) => s.type)?.type
    const first = useGraphStore
      .getState()
      .nodes.find((n) => n.type === firstType && !n.parentId)
    if (!first) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const size = nodeSize(first)
        setViewport(
          {
            x: window.innerWidth / 2 - (first.position.x + size.width / 2),
            y: window.innerHeight / 2 - (first.position.y + size.height / 2),
            zoom: 1,
          },
          { duration: 0 },
        )
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = STEPS[step]
  const target = current.type
    ? nodes.find((n) => n.type === current.type && !n.parentId && !n.hidden)
    : undefined

  useEffect(() => {
    if (!visible || !target) return
    // Give the just-revealed node a frame to mount before fitting to it
    const t = setTimeout(
      () =>
        fitView({
          nodes: [{ id: target.id }],
          padding: 0.6,
          duration: 400,
          maxZoom: 1,
        }),
      120,
    )
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visible])

  if (!visible) return null

  const dismiss = () => {
    revealAll()
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      /* private mode — just close */
    }
    setVisible(false)
    // Recenter on the whole graph once the just-revealed nodes have mounted
    // and been measured (fitView skips unmeasured nodes)
    setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 150)
  }
  const next = () => {
    if (step >= STEPS.length - 1) {
      dismiss()
      return
    }
    const upcoming = STEPS[step + 1]
    if (upcoming.type) revealType(upcoming.type)
    setStep(step + 1)
  }

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
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {rect ? (
        // Spotlight: the giant shadow dims everything outside the ring.
        // No CSS transition — the ring tracks the viewport transform per
        // frame, and layering a transition on top reads as rubber-banding.
        <div
          className="absolute rounded-2xl border-2 border-accent"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow:
              '0 0 0 4px rgba(59, 130, 246, 0.15), 0 0 0 200vmax rgba(0, 0, 0, 0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40" />
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
