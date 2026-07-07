import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { StockNode as StockNodeT } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { TickerSelect } from '../TickerSelect'
import { getTickerInfo, TICKER_BADGE_CLASSES } from '../../lib/tickers'
import { AnimatedHeight } from '../AnimatedHeight'
import { NumberField } from '../NumberField'

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
        selected ? 'border-accent' : 'border-border hover:border-border-strong'
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
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-text-muted">
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
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-text-muted">
                  Allocation
                </span>
                <div className="flex items-center rounded-md border border-border bg-surface-2 focus-within:border-accent">
                  <span className="pl-2 font-mono text-sm text-text-muted">$</span>
                  <NumberField
                    min={0}
                    step={100}
                    value={data.allocation}
                    onChange={(allocation) =>
                      updateNodeData<StockNodeT['data']>(id, { allocation })
                    }
                    className="w-full bg-transparent px-2 py-2 text-sm text-text outline-none"
                  />
                </div>
              </label>
            )}
          </div>

          {!data.ticker && (
            <p className="px-1 text-center text-[11px] leading-snug text-text-muted">
              Search and select a stock, ETF, or digital asset to get started
            </p>
          )}

          {info && (
            <div className="rounded-md bg-surface-2/60 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-muted">
                  {info.name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-px text-[11px] font-medium ${TICKER_BADGE_CLASSES[info.type]}`}
                >
                  {info.type}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-text-muted">
                {info.description}
              </p>
            </div>
          )}

          {feedsPortfolio && (
            <p className="rounded-md border border-negative/40 bg-negative/10 p-2 text-[11px] leading-snug text-negative">
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
