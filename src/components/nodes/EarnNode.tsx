import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { EarnNode as EarnNodeT, EarnStrategy } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { AnimatedHeight } from '../AnimatedHeight'
import { Segmented } from '../Segmented'

const STRATEGIES: { value: EarnStrategy; label: string }[] = [
  { value: 'hold', label: 'Hold' },
  { value: 'stake', label: 'Stake' },
  { value: 'lend', label: 'Lend' },
  { value: 'borrow', label: 'Borrow' },
]

// Sensible starting APRs; borrow is a cost, hence negative
const DEFAULT_APR: Record<EarnStrategy, number> = {
  hold: 0,
  stake: 4,
  lend: 5,
  borrow: -6,
}

export function EarnNode({ id, data, selected }: NodeProps<EarnNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)

  return (
    <div
      className={`w-60 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border'
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
            <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-text-dim">
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
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-dim">
                APR
              </span>
              <div className="flex items-center rounded-md border border-border bg-surface-2 focus-within:border-accent">
                <input
                  type="number"
                  step={0.5}
                  value={data.apr}
                  onChange={(e) =>
                    updateNodeData<EarnNodeT['data']>(id, {
                      apr: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-transparent px-2 py-1.5 text-sm text-text outline-none"
                />
                <span className="pr-2 text-sm text-text-dim">%</span>
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
