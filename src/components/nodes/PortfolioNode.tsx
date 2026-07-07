import { useEffect, useMemo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Liveline, type LivelinePoint } from 'liveline'
import type {
  PortfolioNode as PortfolioNodeT,
  StockNode,
  TimelineNode,
} from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import {
  computePortfolio,
  type PortfolioResult,
  type Position as PortfolioPosition,
} from '../../lib/portfolioMath'
import { isUsingMockData } from '../../lib/twelveData'
import { AnimatedHeight } from '../AnimatedHeight'

type Inputs = {
  timelineId: string | null
  mode: TimelineNode['data']['mode'] | null
  timeframe: TimelineNode['data']['timeframe'] | null
  positions: PortfolioPosition[]
}

function useInputs(portfolioId: string): Inputs {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)

  return useMemo(() => {
    const incomingToPortfolio = edges.filter((e) => e.target === portfolioId)
    const timelineEdge = incomingToPortfolio.find((e) => {
      const n = nodes.find((x) => x.id === e.source)
      return n?.type === 'timeline'
    })
    if (!timelineEdge) {
      return { timelineId: null, mode: null, timeframe: null, positions: [] }
    }
    const timeline = nodes.find((n) => n.id === timelineEdge.source) as
      | TimelineNode
      | undefined
    if (!timeline) {
      return { timelineId: null, mode: null, timeframe: null, positions: [] }
    }

    const toPosition = (n: StockNode, yieldApr: number): PortfolioPosition => ({
      ticker: n.data.ticker.trim().toUpperCase(),
      allocation: n.data.allocation,
      yieldApr,
    })

    // Assets feed the timeline directly, or through an Earn node that
    // layers a yield APR on top of the asset's price return.
    const positions: PortfolioPosition[] = []
    for (const e of edges.filter((x) => x.target === timeline.id)) {
      const src = nodes.find((n) => n.id === e.source)
      if (src?.type === 'stock') {
        positions.push(toPosition(src, 0))
      } else if (src?.type === 'earn') {
        const apr = src.data.strategy === 'hold' ? 0 : src.data.apr
        for (const e2 of edges.filter((x) => x.target === src.id)) {
          const asset = nodes.find((n) => n.id === e2.source)
          if (asset?.type === 'stock') positions.push(toPosition(asset, apr))
        }
      }
    }

    return {
      timelineId: timeline.id,
      mode: timeline.data.mode,
      timeframe: timeline.data.timeframe,
      positions: positions.filter((p) => p.ticker && p.allocation > 0),
    }
  }, [portfolioId, nodes, edges])
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

function fmtMoney(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 10_000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(0)}`
}

export function PortfolioNode({ id, selected }: NodeProps<PortfolioNodeT>) {
  const inputs = useInputs(id)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Stable signature of the inputs — debounce + refetch on change.
  const sig = useMemo(
    () =>
      JSON.stringify({
        m: inputs.mode,
        t: inputs.timeframe,
        p: inputs.positions,
      }),
    [inputs],
  )

  useEffect(() => {
    if (!inputs.mode || !inputs.timeframe || inputs.positions.length === 0) {
      setStatus('idle')
      setResult(null)
      setErrMsg(null)
      return
    }

    let cancelled = false
    setStatus('loading')
    setErrMsg(null)

    const t = setTimeout(async () => {
      try {
        const r = await computePortfolio(
          inputs.positions,
          inputs.mode!,
          inputs.timeframe!,
        )
        if (cancelled) return
        setResult(r)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setErrMsg(err instanceof Error ? err.message : 'Failed to compute')
        setStatus('error')
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  const positive = (result?.totalReturnDollars ?? 0) >= 0

  // Liveline anchors its right edge to the present, so shift the series to
  // end at "now" (projections live in the future) and undo the shift in the
  // time labels.
  const chart = useMemo(() => {
    const s = result?.series
    if (!s || s.length < 2) return null
    const toSec = (date: string) => Date.parse(date) / 1000
    const offset = Math.floor(Date.now() / 1000) - toSec(s[s.length - 1].date)
    const points: LivelinePoint[] = s.map((p) => ({
      time: toSec(p.date) + offset,
      value: p.value,
    }))
    return {
      points,
      offset,
      span: points[points.length - 1].time - points[0].time,
    }
  }, [result])

  return (
    <div
      className={`w-72 rounded-xl border bg-surface shadow-lg transition-colors ${
        selected ? 'border-accent' : 'border-border hover:border-border-strong'
      }`}
    >
      <div className="relative border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Portfolio
        </span>
        {inputs.mode && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider text-text-muted">
            {inputs.mode === 'projection' ? 'Projection' : 'Backtest'} ·{' '}
            {inputs.timeframe}
          </span>
        )}
      </div>

      <AnimatedHeight>
        <div className="space-y-3 p-3">
          {status === 'idle' && (
            <div className="rounded-md border border-dashed border-border bg-surface-2/50 p-4 text-center text-[11px] text-text-muted">
              Connect Asset → Timeline → here
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md border border-negative/40 bg-negative/10 p-3 text-center text-[11px] text-negative">
              {errMsg ?? 'Failed to compute'}
            </div>
          )}

          {(status === 'loading' || status === 'ready') && (
            <>
              {chart && (
                <div className="nodrag nowheel h-28">
                  <Liveline
                    data={chart.points}
                    value={chart.points[chart.points.length - 1].value}
                    color={positive ? '#10b981' : '#ef4444'}
                    theme="dark"
                    grid={false}
                    badgeVariant="minimal"
                    window={chart.span}
                    loading={status === 'loading'}
                    // default right padding reserves 80px for the badge —
                    // far too much inside a 264px-wide node
                    padding={{ top: 10, right: 52, bottom: 24, left: 6 }}
                    formatValue={fmtMoney}
                    formatTime={(t) =>
                      new Date((t - chart.offset) * 1000).toLocaleDateString(
                        undefined,
                        { month: 'short', year: '2-digit' },
                      )
                    }
                  />
                </div>
              )}

              {result && result.positions.length > 0 && (
                <div className="rounded-md bg-surface-2/60 p-2">
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-text-muted">
                    Holdings
                  </div>
                  <div className="space-y-1">
                    {result.positions.map((p) => {
                      const posPos = p.returnPct >= 0
                      return (
                        <div
                          key={p.ticker}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="text-text-muted">{p.ticker}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono tabular-nums ${
                                posPos ? 'text-positive' : 'text-negative'
                              }`}
                            >
                              {posPos ? '+' : ''}
                              {p.returnPct.toFixed(1)}%
                            </span>
                            <span className="font-mono text-text tabular-nums">
                              {fmtMoney(p.allocation)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {result && (
                <div className="rounded-md bg-surface-2/60 p-2">
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-text-muted">
                    Totals
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Invested</span>
                      <span className="font-mono text-text tabular-nums">
                        {fmtMoney(result.invested)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Gains</span>
                      <span
                        className={`font-mono tabular-nums ${
                          positive ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {positive ? '+' : '-'}
                        {fmtMoney(Math.abs(result.totalReturnDollars))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Return</span>
                      <span className="font-mono text-text tabular-nums">
                        {fmtMoney(result.endingValue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isUsingMockData() && (
                <div className="text-center text-[11px] uppercase tracking-wider text-text-muted">
                  Mock data
                </div>
              )}
            </>
          )}
        </div>
      </AnimatedHeight>

      <Handle type="target" position={Position.Left} />
    </div>
  )
}
