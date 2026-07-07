import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { EarnNode as EarnNodeT, EarnStrategy } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { AnimatedHeight } from '../AnimatedHeight'
import { Segmented } from '../Segmented'
import { NumberField } from '../NumberField'

const STRATEGIES: { value: EarnStrategy; label: string }[] = [
  { value: 'hold', label: 'Hold' },
  { value: 'yield', label: 'Yield' },
]

// Hold is a plain passthrough; Yield exposes an editable APR. Negative
// values model a borrow cost.
const DEFAULT_APR: Record<EarnStrategy, number> = {
  hold: 0,
  yield: 5,
}

export function EarnNode({ id, data, selected }: NodeProps<EarnNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)

  return (
    <div
      className={`w-60 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border hover:border-border-strong'
      }`}
    >
      <div className="border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Earn
        </span>
      </div>

      <AnimatedHeight>
        <div className="space-y-3 p-3">
          <div>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-text-muted">
              Strategy
            </span>
            <Segmented
              options={STRATEGIES}
              value={data.strategy}
              onChange={(strategy) =>
                updateNodeData<EarnNodeT['data']>(id, {
                  strategy,
                  apr: DEFAULT_APR[strategy],
                })
              }
            />
          </div>

          {data.strategy !== 'hold' && (
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-text-muted">
                APR
              </span>
              <div className="flex items-center rounded-md border border-border bg-surface-2 focus-within:border-accent">
                <NumberField
                  step={0.5}
                  value={data.apr}
                  onChange={(apr) =>
                    updateNodeData<EarnNodeT['data']>(id, { apr })
                  }
                  className="w-full bg-transparent px-2 py-2 text-sm text-text outline-none"
                />
                <span className="pr-2 font-mono text-sm text-text-muted">%</span>
              </div>
            </label>
          )}
        </div>
      </AnimatedHeight>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
