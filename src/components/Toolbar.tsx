import { useEffect, useRef, useState } from 'react'
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

type ToolbarMode = 'add' | 'remove'

export function Toolbar() {
  const addNode = useGraphStore((s) => s.addNode)
  const removeNodesByType = useGraphStore((s) => s.removeNodesByType)
  const clearGraph = useGraphStore((s) => s.clearGraph)

  const [mode, setMode] = useState<ToolbarMode>('add')

  // "All" needs a second click within 2.5s to actually clear the canvas
  const [confirmAll, setConfirmAll] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  const disarm = () => {
    clearTimeout(confirmTimer.current)
    setConfirmAll(false)
  }

  const switchMode = (m: ToolbarMode) => {
    setMode(m)
    disarm()
  }

  const onType = (b: (typeof BUTTONS)[number]) => {
    if (mode === 'add') {
      addNode(b.build(findFreePosition(useGraphStore.getState().nodes, b.type)))
    } else {
      removeNodesByType(b.type)
    }
  }

  const onRemoveAll = () => {
    if (confirmAll) {
      disarm()
      clearGraph()
    } else {
      setConfirmAll(true)
      confirmTimer.current = setTimeout(() => setConfirmAll(false), 2500)
    }
  }

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-border bg-surface/95 p-1 shadow-lg backdrop-blur">
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5">
        <button
          onClick={() => switchMode('add')}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            mode === 'add'
              ? 'bg-accent/20 text-accent'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Add
        </button>
        <button
          onClick={() => switchMode('remove')}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            mode === 'remove'
              ? 'bg-negative/15 text-negative'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Remove
        </button>
      </div>

      {BUTTONS.map((b) => (
        <button
          key={b.type}
          onClick={() => onType(b)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors ${
            mode === 'add'
              ? 'hover:bg-surface-2 hover:text-text'
              : 'hover:bg-negative/10 hover:text-negative'
          }`}
        >
          {b.label}
        </button>
      ))}

      {mode === 'remove' && (
        <button
          onClick={onRemoveAll}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            confirmAll
              ? 'bg-negative/15 text-negative'
              : 'text-text-muted hover:bg-negative/10 hover:text-negative'
          }`}
        >
          {confirmAll ? 'Sure?' : 'All'}
        </button>
      )}
    </div>
  )
}
