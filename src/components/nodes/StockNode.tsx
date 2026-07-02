import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { StockNode as StockNodeT } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { TickerSelect } from '../TickerSelect'

export function StockNode({ id, data, selected }: NodeProps<StockNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)

  return (
    <div
      className={`w-56 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Stock / ETF
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>

      <div className="space-y-3 p-3">
        <div>
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-dim">
            Ticker
          </span>
          <TickerSelect
            value={data.ticker}
            onChange={(ticker) =>
              updateNodeData<StockNodeT['data']>(id, { ticker })
            }
          />
        </div>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-dim">
            Allocation (USD)
          </span>
          <div className="flex items-center rounded-md border border-border bg-surface-2 focus-within:border-accent">
            <span className="pl-2 text-sm text-text-dim">$</span>
            <input
              type="number"
              min={0}
              step={100}
              value={data.allocation}
              onChange={(e) =>
                updateNodeData<StockNodeT['data']>(id, {
                  allocation: Number(e.target.value) || 0,
                })
              }
              className="w-full bg-transparent px-2 py-1.5 text-sm text-text outline-none"
            />
          </div>
        </label>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
