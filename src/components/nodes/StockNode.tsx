import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { StockNode as StockNodeT } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { TickerSelect } from '../TickerSelect'
import { getTickerInfo, TICKER_BADGE_CLASSES } from '../../lib/tickers'
import { AnimatedHeight } from '../AnimatedHeight'

export function StockNode({ id, data, selected }: NodeProps<StockNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  const info = getTickerInfo(data.ticker)
  // Wired straight into a portfolio — that edge is inert, flag it
  const feedsPortfolio = useGraphStore((s) =>
    s.edges.some(
      (e) =>
        e.source === id &&
        s.nodes.find((n) => n.id === e.target)?.type === 'portfolio',
    ),
  )

  return (
    <div
      className={`w-64 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border'
      }`}
    >
      <div className="border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Asset
        </span>
      </div>

      <AnimatedHeight>
        <div className="space-y-3 p-3">
          <div className={data.ticker ? 'grid grid-cols-2 gap-2' : ''}>
            <div>
              {data.ticker && (
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-dim">
                  Ticker
                </span>
              )}
              <TickerSelect
                value={data.ticker}
                onChange={(ticker) =>
                  updateNodeData<StockNodeT['data']>(id, { ticker })
                }
              />
            </div>

            {data.ticker && (
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-dim">
                  Allocation
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
            )}
          </div>

          {!data.ticker && (
            <p className="px-1 pb-1 text-center text-[10px] leading-snug text-text-dim">
              Search and select a stock, ETF, or digital asset to get started
            </p>
          )}

          {info && (
            <div className="rounded-md bg-surface-2/60 px-2 py-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-[11px] font-medium text-text-muted">
                  {info.name}
                </span>
                <span
                  className={`shrink-0 rounded px-1 py-px text-[9px] font-medium uppercase tracking-wider ${TICKER_BADGE_CLASSES[info.type]}`}
                >
                  {info.type}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-text-dim">
                {info.description}
              </p>
            </div>
          )}

          {feedsPortfolio && (
            <p className="rounded-md border border-negative/40 bg-negative/10 px-2 py-1.5 text-[10px] leading-snug text-negative">
              An asset can't feed a Portfolio directly — connect it to a
              Timeline node instead.
            </p>
          )}
        </div>
      </AnimatedHeight>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
