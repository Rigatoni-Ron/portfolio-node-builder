import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import {
  MousePointer2,
  Hand,
  Plus,
  TrendingUp,
  Percent,
  CalendarRange,
  ChartPie,
  LayoutGrid,
} from 'lucide-react'
import { AnimatedWidth } from './AnimatedWidth'
import { useMeasure } from '../lib/useMeasure'
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
  ref,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
  ref?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${
        active
          ? 'bg-accent/20 text-accent'
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
  const tidyNodes = useGraphStore((s) => s.tidyNodes)
  const groupableCount = useGraphStore((s) => s.nodes.filter(groupable).length)

  const [addOpen, setAddOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Animate the pill's width as buttons appear/disappear on selection change.
  // Clipped at all times so appearing buttons never spill before the pill
  // grows; the add menu is portaled out so the clip doesn't cut it off.
  const [measureRef, bounds] = useMeasure<HTMLDivElement>()
  const addBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(
    null,
  )

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

  // Anchor the portaled add menu under its button
  useLayoutEffect(() => {
    if (addOpen && addBtnRef.current) {
      const r = addBtnRef.current.getBoundingClientRect()
      setMenuPos({ left: r.left, top: r.bottom + 8 })
    }
  }, [addOpen])

  // Close the add menu on outside click (the menu is portaled, so check it too)
  useEffect(() => {
    if (!addOpen) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target))
        return
      setAddOpen(false)
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
    <div ref={rootRef} className="absolute left-4 top-4 z-10">
      <motion.div
        className="pointer-events-auto overflow-hidden rounded-xl border border-border bg-surface/95 shadow-lg backdrop-blur"
        initial={false}
        animate={bounds.width > 0 ? { width: bounds.width } : undefined}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        <div ref={measureRef} className="flex w-max items-center gap-1 p-1">
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

      <ToolButton
        ref={addBtnRef}
        active={addOpen}
        title="Add node — A"
        onClick={() => setAddOpen((o) => !o)}
      >
        <Plus size={16} />
      </ToolButton>

      {groupableCount >= 2 && (
        <>
          <div className="h-4 w-px bg-border" />
          <button
            title="Tidy up"
            onClick={() =>
              tidyNodes(
                useGraphStore.getState().nodes.filter(groupable).map((n) => n.id),
              )
            }
            className="rounded-lg p-2 text-accent transition-colors hover:bg-accent-soft"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() =>
              groupNodes(
                useGraphStore.getState().nodes.filter(groupable).map((n) => n.id),
              )
            }
            className="rounded-lg px-3 py-2 text-[11px] font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            Group ({groupableCount})
          </button>
        </>
      )}

      <div className="h-5 w-px bg-border" />

      <button
        onClick={onClearAll}
        className={`rounded-lg text-[11px] font-medium transition-colors ${
          confirmClear
            ? 'bg-negative/15 text-negative'
            : 'text-text-muted hover:bg-negative/10 hover:text-negative'
        }`}
      >
        <AnimatedWidth>
          <span className="block whitespace-nowrap px-3 py-2">
            {confirmClear ? 'Are you sure?' : 'Clear all'}
          </span>
        </AnimatedWidth>
      </button>
        </div>
      </motion.div>

      {addOpen &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', left: menuPos.left, top: menuPos.top }}
            className="pointer-events-auto z-50 w-40 rounded-lg border border-border bg-surface p-1 shadow-xl"
          >
            {NODE_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => addNodeOfType(option)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <option.icon size={14} className="text-text-muted" />
                {option.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
