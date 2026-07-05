import { useEffect, useRef, useState } from 'react'
import {
  MousePointer2,
  Hand,
  Plus,
  TrendingUp,
  Percent,
  CalendarRange,
  ChartPie,
} from 'lucide-react'
import { AnimatedWidth } from './AnimatedWidth'
import { useGraphStore, type CanvasTool } from '../store/graphStore'
import type { AppNode } from '../lib/types'
import { findFreePosition } from '../lib/placement'
import type { XYPosition } from '@xyflow/react'

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const NODE_OPTIONS: {
  type: NonNullable<AppNode['type']>
  label: string
  icon: typeof TrendingUp
  build: (position: XYPosition) => AppNode
}[] = [
  {
    type: 'stock',
    label: 'Asset',
    icon: TrendingUp,
    build: (position) => ({
      id: makeId('stock'),
      type: 'stock',
      position,
      data: { ticker: '', allocation: 1000 },
    }),
  },
  {
    type: 'earn',
    label: 'Earn',
    icon: Percent,
    build: (position) => ({
      id: makeId('earn'),
      type: 'earn',
      position,
      data: { strategy: 'hold', apr: 0 },
    }),
  },
  {
    type: 'timeline',
    label: 'Timeline',
    icon: CalendarRange,
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
    icon: ChartPie,
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

function ToolButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'text-text-muted hover:bg-surface-2 hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

export function Toolbar() {
  const tool = useGraphStore((s) => s.tool)
  const setTool = useGraphStore((s) => s.setTool)
  const addNode = useGraphStore((s) => s.addNode)
  const clearGraph = useGraphStore((s) => s.clearGraph)
  const groupNodes = useGraphStore((s) => s.groupNodes)
  const groupableCount = useGraphStore((s) => s.nodes.filter(groupable).length)

  const [addOpen, setAddOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // "Clear all" needs a second click within 2.5s to actually clear the canvas
  const [confirmClear, setConfirmClear] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  // Hotkeys: V select, H hand, A add menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (
        e.target instanceof Element &&
        e.target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return
      const key = e.key.toLowerCase()
      if (key === 'v') {
        setTool('select')
        setAddOpen(false)
      } else if (key === 'h') {
        setTool('hand')
        setAddOpen(false)
      } else if (key === 'a') {
        e.preventDefault()
        setAddOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setTool])

  // Close the add menu on outside click
  useEffect(() => {
    if (!addOpen) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [addOpen])

  const selectTool = (t: CanvasTool) => {
    setTool(t)
    setAddOpen(false)
  }

  const addNodeOfType = (option: (typeof NODE_OPTIONS)[number]) => {
    addNode(
      option.build(
        findFreePosition(useGraphStore.getState().nodes, option.type),
      ),
    )
    setAddOpen(false)
  }

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
    <div
      ref={rootRef}
      className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-border bg-surface/95 p-1 shadow-lg backdrop-blur"
    >
      <ToolButton
        active={tool === 'select' && !addOpen}
        title="Select — V"
        onClick={() => selectTool('select')}
      >
        <MousePointer2 size={16} />
      </ToolButton>

      <ToolButton
        active={tool === 'hand'}
        title="Hand — H"
        onClick={() => selectTool('hand')}
      >
        <Hand size={16} />
      </ToolButton>

      <div className="relative">
        <ToolButton
          active={addOpen}
          title="Add node — A"
          onClick={() => setAddOpen((o) => !o)}
        >
          <Plus size={16} />
        </ToolButton>

        {addOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-surface p-1 shadow-xl">
            {NODE_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => addNodeOfType(option)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <option.icon size={14} className="text-text-dim" />
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

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
    </div>
  )
}
