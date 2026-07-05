import { useEffect, useMemo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Liveline, type LivelinePoint } from 'liveline'
import type {
  PortfolioNode as PortfolioNodeT,
  StockNode,
  TimelineNode,
} from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { computePortfolio, type PortfolioResult } from '../../lib/portfolioMath'
import { isUsingMockData } from '../../lib/twelveData'
import { AnimatedHeight } from '../AnimatedHeight'

type Inputs = {
  timelineId: string | null
  mode: TimelineNode['data']['mode'] | null
  timeframe: TimelineNode['data']['timeframe'] | null
  positions: { ticker: string; allocation: number }[]
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

    const stockEdges = edges.filter((e) => e.target === timeline.id)
    const positions = stockEdges
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter((n): n is StockNode => n?.type === 'stock')
      .map((n) => ({
        ticker: n.data.ticker.trim().toUpperCase(),
        allocation: n.data.allocation,
      }))
      .filter((p) => p.ticker && p.allocation > 0)

    return {
      timelineId: timeline.id,
      mode: timeline.data.mode,
      timeframe: timeline.data.timeframe,
      positions,
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
        selected ? 'border-accent' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Portfolio
        </span>
        <div className="flex items-center gap-1.5">
          {status === 'loading' && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          )}
          {status === 'ready' && (
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          )}
          {status === 'error' && (
            <span className="h-1.5 w-1.5 rounded-full bg-negative" />
          )}
          {status === 'idle' && (
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
          )}
        </div>
      </div>

      <AnimatedHeight>
        <div className="space-y-3 p-3">
          {status === 'idle' && (
            <div className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-[11px] text-text-dim">
              Connect Stock nodes → Timeline → here
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md border border-negative/40 bg-negative/10 px-3 py-3 text-center text-[11px] text-negative">
              {errMsg ?? 'Failed to compute'}
            </div>
          )}

          {(status === 'loading' || status === 'ready') && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-dim">
                  {result?.mode === 'projection' ? 'Projected return' : 'Total return'}
                </div>
                <div
                  className={`mt-0.5 font-mono text-2xl font-medium tabular-nums ${
                    status === 'loading'
                      ? 'text-text-dim'
                      : positive
                        ? 'text-positive'
                        : 'text-negative'
                  }`}
                >
                  {result
                    ? `${positive ? '+' : ''}${result.totalReturnPct.toFixed(2)}%`
                    : '—'}
                </div>
                <div
                  className={`font-mono text-xs tabular-nums ${
                    status === 'loading'
                      ? 'text-text-dim'
                      : positive
                        ? 'text-positive'
                        : 'text-negative'
                  }`}
                >
                  {result
                    ? `${positive ? '+' : '-'}${fmtMoney(Math.abs(result.totalReturnDollars))}`
                    : ''}
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-dim">
                    Invested
                  </div>
                  <div className="font-mono text-sm tabular-nums text-text">
                    {result ? fmtMoney(result.invested) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-dim">
                    {result?.mode === 'projection' ? 'Projected' : 'Ending'}
                  </div>
                  <div className="font-mono text-sm tabular-nums text-text">
                    {result ? fmtMoney(result.endingValue) : '—'}
                  </div>
                </div>
              </div>

              {result && result.positions.length > 0 && (
                <div className="border-t border-border pt-3">
                  <div className="mb-2 text-[10px] uppercase tracking-wider text-text-dim">
                    Holdings
                  </div>
                  <div className="space-y-1">
                    {result.positions.map((p) => {
                      const posPos = p.returnPct >= 0
                      return (
                        <div
                          key={p.ticker}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-mono font-medium text-text">
                            {p.ticker}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-text-dim tabular-nums">
                              {fmtMoney(p.allocation)}
                            </span>
                            <span
                              className={`font-mono tabular-nums ${
                                posPos ? 'text-positive' : 'text-negative'
                              }`}
                            >
                              {posPos ? '+' : ''}
                              {p.returnPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] uppercase tracking-wider text-text-dim">
                <span>
                  {result?.mode === 'projection' ? 'Projection' : 'Backtest'} ·{' '}
                  {result?.timeframe ?? inputs.timeframe}
                </span>
                {isUsingMockData() && <span className="text-accent">Mock data</span>}
              </div>
            </>
          )}
        </div>
      </AnimatedHeight>

      <Handle type="target" position={Position.Left} />
    </div>
  )
}
