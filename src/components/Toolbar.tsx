import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { AnimatedWidth } from './AnimatedWidth'
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

const groupable = (n: AppNode) =>
  !!n.selected && n.type !== 'group' && !n.parentId

export function Toolbar() {
  const addNode = useGraphStore((s) => s.addNode)
  const clearGraph = useGraphStore((s) => s.clearGraph)
  const groupNodes = useGraphStore((s) => s.groupNodes)
  const groupableCount = useGraphStore((s) => s.nodes.filter(groupable).length)

  // "Clear all" needs a second click within 2.5s to actually clear the canvas
  const [confirmClear, setConfirmClear] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  const onClearAll = () => {
    if (confirmClear) {
      clearTimeout(confirmTimer.current)
      setConfirmClear(false)
      clearGraph()
    } else {
      setConfirmClear(true)
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 2500)
    }
  }

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-border bg-surface/95 p-1 shadow-lg backdrop-blur">
      {BUTTONS.map((b) => (
        <button
          key={b.type}
          onClick={() =>
            addNode(b.build(findFreePosition(useGraphStore.getState().nodes, b.type)))
          }
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Plus size={13} strokeWidth={2.25} />
          {b.label}
        </button>
      ))}

      <div className="h-5 w-px bg-border" />

      <button
        onClick={onClearAll}
        className={`rounded-lg text-xs font-medium transition-colors ${
          confirmClear
            ? 'bg-negative/15 text-negative'
            : 'text-text-muted hover:bg-negative/10 hover:text-negative'
        }`}
      >
        <AnimatedWidth>
          <span className="block whitespace-nowrap px-3 py-1.5">
            {confirmClear ? 'Are you sure?' : 'Clear all'}
          </span>
        </AnimatedWidth>
      </button>

      {groupableCount >= 2 && (
        <>
          <div className="h-5 w-px bg-border" />
          <button
            onClick={() =>
              groupNodes(
                useGraphStore.getState().nodes.filter(groupable).map((n) => n.id),
              )
            }
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            Group ({groupableCount})
          </button>
        </>
      )}
    </div>
  )
}
