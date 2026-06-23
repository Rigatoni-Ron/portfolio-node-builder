import type { Timeframe, TimelineMode } from './types'
import { getPriceSeries, type PriceBar, type PriceSource } from './twelveData'

export type Position = { ticker: string; allocation: number }

export type PositionResult = {
  ticker: string
  allocation: number
  endingValue: number
  returnPct: number
  source: PriceSource
  error?: string
}

export type PortfolioResult = {
  mode: TimelineMode
  timeframe: Timeframe
  invested: number
  endingValue: number
  totalReturnDollars: number
  totalReturnPct: number
  positions: PositionResult[]
  sources: PriceSource[] // distinct sources seen
}

const YEARS: Record<Timeframe, number> = { '1Y': 1, '3Y': 3, '5Y': 5, '10Y': 10 }

// Slice the trailing N months from a sorted (ascending) bar series.
function trailingMonths(bars: PriceBar[], months: number): PriceBar[] {
  if (bars.length <= months) return bars
  return bars.slice(bars.length - months - 1)
}

// Realized historical return over the window: (last - first) / first.
function backtestReturn(bars: PriceBar[], years: number): number {
  const window = trailingMonths(bars, years * 12)
  if (window.length < 2) return 0
  const first = window[0].close
  const last = window[window.length - 1].close
  if (first <= 0) return 0
  return (last - first) / first
}

// Forward CAGR-based point estimate. CAGR is computed from the full 10y series.
function projectionReturn(bars: PriceBar[], years: number): number {
  if (bars.length < 2) return 0
  const first = bars[0].close
  const last = bars[bars.length - 1].close
  if (first <= 0) return 0
  const historyYears = (bars.length - 1) / 12
  if (historyYears <= 0) return 0
  const cagr = Math.pow(last / first, 1 / historyYears) - 1
  return Math.pow(1 + cagr, years) - 1
}

export async function computePortfolio(
  positions: Position[],
  mode: TimelineMode,
  timeframe: Timeframe,
): Promise<PortfolioResult> {
  const years = YEARS[timeframe]
  const valid = positions.filter((p) => p.ticker && p.allocation > 0)

  const results = await Promise.all(
    valid.map(async (p): Promise<PositionResult> => {
      try {
        const series = await getPriceSeries(p.ticker)
        const ret =
          mode === 'backtest'
            ? backtestReturn(series.bars, years)
            : projectionReturn(series.bars, years)
        const endingValue = p.allocation * (1 + ret)
        return {
          ticker: p.ticker.toUpperCase(),
          allocation: p.allocation,
          endingValue,
          returnPct: ret * 100,
          source: series.source,
        }
      } catch (err) {
        return {
          ticker: p.ticker.toUpperCase(),
          allocation: p.allocation,
          endingValue: p.allocation,
          returnPct: 0,
          source: 'mock',
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }),
  )

  const invested = results.reduce((s, r) => s + r.allocation, 0)
  const endingValue = results.reduce((s, r) => s + r.endingValue, 0)
  const totalReturnDollars = endingValue - invested
  const totalReturnPct = invested > 0 ? (totalReturnDollars / invested) * 100 : 0
  const sources = Array.from(new Set(results.map((r) => r.source)))

  return {
    mode,
    timeframe,
    invested,
    endingValue,
    totalReturnDollars,
    totalReturnPct,
    positions: results,
    sources,
  }
}
