import { useGraphStore } from '../store/graphStore'
import type { AppNode } from '../lib/types'

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const BUTTONS: { type: AppNode['type']; label: string; build: () => AppNode }[] = [
  {
    type: 'stock',
    label: 'Stock',
    build: () => ({
      id: makeId('stock'),
      type: 'stock',
      position: { x: 120 + Math.random() * 60, y: 120 + Math.random() * 60 },
      data: { ticker: 'SPY', allocation: 1000 },
    }),
  },
  {
    type: 'timeline',
    label: 'Timeline',
    build: () => ({
      id: makeId('timeline'),
      type: 'timeline',
      position: { x: 480 + Math.random() * 60, y: 200 + Math.random() * 60 },
      data: { mode: 'backtest', timeframe: '5Y' },
    }),
  },
  {
    type: 'portfolio',
    label: 'Portfolio',
    build: () => ({
      id: makeId('portfolio'),
      type: 'portfolio',
      position: { x: 860 + Math.random() * 60, y: 200 + Math.random() * 60 },
      data: {},
    }),
  },
]

export function Toolbar() {
  const addNode = useGraphStore((s) => s.addNode)

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-border bg-surface/95 p-1 shadow-lg backdrop-blur">
      <div className="px-2 text-[10px] font-medium uppercase tracking-wider text-text-dim">
        Add
      </div>
      {BUTTONS.map((b) => (
        <button
          key={b.type}
          onClick={() => addNode(b.build())}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
