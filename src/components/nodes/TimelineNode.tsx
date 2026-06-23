import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TimelineNode as TimelineNodeT, Timeframe, TimelineMode } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'

const TIMEFRAMES: Timeframe[] = ['1Y', '3Y', '5Y', '10Y']
const MODES: { value: TimelineMode; label: string }[] = [
  { value: 'backtest', label: 'Backtest' },
  { value: 'projection', label: 'Projection' },
]

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)

  return (
    <div
      className={`w-60 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Timeline
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>

      <div className="space-y-3 p-3">
        <div>
          <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-dim">
            Mode
          </span>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface-2 p-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => updateNodeData<TimelineNodeT['data']>(id, { mode: m.value })}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  data.mode === m.value
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-dim">
            {data.mode === 'backtest' ? 'Past' : 'Next'}
          </span>
          <div className="grid grid-cols-4 gap-1 rounded-md border border-border bg-surface-2 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => updateNodeData<TimelineNodeT['data']>(id, { timeframe: tf })}
                className={`rounded px-1 py-1 text-xs font-medium transition-colors ${
                  data.timeframe === tf
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
