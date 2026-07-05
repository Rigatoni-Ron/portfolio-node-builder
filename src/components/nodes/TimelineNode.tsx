import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'motion/react'
import type { TimelineNode as TimelineNodeT, Timeframe, TimelineMode } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { AnimatedHeight } from '../AnimatedHeight'

const TIMEFRAMES: Timeframe[] = ['1Y', '3Y', '5Y', '10Y']
const MODES: { value: TimelineMode; label: string }[] = [
  { value: 'backtest', label: 'Backtest' },
  { value: 'projection', label: 'Projection' },
]

// Segmented control whose selection pill springs to the active option.
// The pill animates percentage offsets, so it stays exact at any canvas zoom.
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  const n = options.length
  const idx = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div className="rounded-md border border-border bg-surface-2 p-0.5">
      <div className="relative">
        <motion.div
          className="absolute inset-y-0 rounded bg-accent/20"
          style={{ width: `${100 / n}%` }}
          initial={false}
          animate={{ left: `${(idx * 100) / n}%` }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
        />
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                value === o.value
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)

  return (
    <div
      className={`w-60 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border'
      }`}
    >
      <div className="border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Timeline
        </span>
      </div>

      <AnimatedHeight>
        <div className="space-y-3 p-3">
          <div>
            <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-dim">
              Mode
            </span>
            <Segmented
              options={MODES}
              value={data.mode}
              onChange={(mode) =>
                updateNodeData<TimelineNodeT['data']>(id, { mode })
              }
            />
          </div>

          <div>
            <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-dim">
              {data.mode === 'backtest' ? 'Past' : 'Next'}
            </span>
            <Segmented
              options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
              value={data.timeframe}
              onChange={(timeframe) =>
                updateNodeData<TimelineNodeT['data']>(id, { timeframe })
              }
            />
          </div>
        </div>
      </AnimatedHeight>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
