import { useGraphStore } from '../store/graphStore'
import type { AppNode } from '../lib/types'
import { findFreePosition } from '../lib/placement'
import type { XYPosition } from '@xyflow/react'

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const BUTTONS: {
  type: NonNullable<AppNode['type']>
  label: string
  build: (position: XYPosition) => AppNode
}[] = [
  {
    type: 'stock',
    label: 'Stock',
    build: (position) => ({
      id: makeId('stock'),
      type: 'stock',
      position,
      data: { ticker: '', allocation: 1000 },
    }),
  },
  {
    type: 'timeline',
    label: 'Timeline',
    build: (position) => ({
      id: makeId('timeline'),
      type: 'timeline',
      position,
      data: { mode: 'backtest', timeframe: '5Y' },
    }),
  },
  {
    type: 'portfolio',
    label: 'Portfolio',
    build: (position) => ({
      id: makeId('portfolio'),
      type: 'portfolio',
      position,
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
          onClick={() =>
            addNode(b.build(findFreePosition(useGraphStore.getState().nodes, b.type)))
          }
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
