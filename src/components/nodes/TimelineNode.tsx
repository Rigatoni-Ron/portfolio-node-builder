import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TimelineNode as TimelineNodeT, Timeframe, TimelineMode } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { AnimatedHeight } from '../AnimatedHeight'
import { Segmented } from '../Segmented'

const TIMEFRAMES: Timeframe[] = ['1Y', '3Y', '5Y', '10Y']
const MODES: { value: TimelineMode; label: string }[] = [
  { value: 'backtest', label: 'Backtest' },
  { value: 'projection', label: 'Projection' },
]

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  // Connected to a portfolio that already reads an earlier timeline — that
  // edge is inert, flag it
  const edgeIgnored = useGraphStore((s) =>
    s.edges.some((e) => {
      if (e.source !== id) return false
      if (s.nodes.find((n) => n.id === e.target)?.type !== 'portfolio')
        return false
      const first = s.edges.find(
        (e2) =>
          e2.target === e.target &&
          s.nodes.find((n) => n.id === e2.source)?.type === 'timeline',
      )
      return !!first && first.source !== id
    }),
  )

  return (
    <div
      className={`w-60 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border hover:border-border-strong'
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
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-text-muted">
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
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-text-muted">
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

          {edgeIgnored && (
            <p className="rounded-md border border-negative/40 bg-negative/10 p-2 text-[11px] leading-snug text-negative">
              That Portfolio already reads another Timeline — this connection
              is ignored.
            </p>
          )}
        </div>
      </AnimatedHeight>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
