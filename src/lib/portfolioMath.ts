import type { Timeframe, TimelineMode } from './types'
import { getPriceSeries, type PriceBar, type PriceSource } from './twelveData'

export type Position = {
  ticker: string
  allocation: number
  yieldApr?: number // annual % from an Earn node (stake/lend/borrow), 0 = plain hold
}

export type SeriesPoint = {
  date: string // ISO yyyy-mm-dd
  value: number // position/portfolio dollar value at that month
}

export type PositionResult = {
  ticker: string
  allocation: number
  endingValue: number
  returnPct: number
  source: PriceSource
  series?: SeriesPoint[] // monthly dollar values over the window
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
  series: SeriesPoint[] // combined monthly portfolio value
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

// Position dollar value at each month of the backtest window, with any
// Earn yield compounding monthly on top of the price move.
function backtestSeries(
  bars: PriceBar[],
  years: number,
  allocation: number,
  yieldApr: number,
): SeriesPoint[] {
  const window = trailingMonths(bars, years * 12)
  const first = window[0]?.close
  if (!first || first <= 0 || window.length < 2) return []
  const monthlyYield = Math.pow(1 + yieldApr / 100, 1 / 12)
  return window.map((b, i) => ({
    date: b.date,
    value: allocation * (b.close / first) * Math.pow(monthlyYield, i),
  }))
}

// Smooth compound growth curve from allocation to the projected value.
function projectionSeries(
  ret: number,
  years: number,
  allocation: number,
): SeriesPoint[] {
  const months = years * 12
  const monthlyGrowth = Math.pow(1 + ret, 1 / months)
  const now = new Date()
  return Array.from({ length: months + 1 }, (_, m) => {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1)
    return {
      date: d.toISOString().slice(0, 10),
      value: allocation * Math.pow(monthlyGrowth, m),
    }
  })
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
        const apr = p.yieldApr ?? 0
        const baseRet =
          mode === 'backtest'
            ? backtestReturn(series.bars, years)
            : projectionReturn(series.bars, years)
        // Earn yield compounds on top of the price return
        const ret = (1 + baseRet) * Math.pow(1 + apr / 100, years) - 1
        const endingValue = p.allocation * (1 + ret)
        return {
          ticker: p.ticker.toUpperCase(),
          allocation: p.allocation,
          endingValue,
          returnPct: ret * 100,
          source: series.source,
          series:
            mode === 'backtest'
              ? backtestSeries(series.bars, years, p.allocation, apr)
              : projectionSeries(ret, years, p.allocation),
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

  // Combined portfolio value per month. Series are aligned from the most
  // recent point backwards; positions without a series (errors) contribute
  // their flat allocation to every point.
  const withSeries = results.filter((r) => (r.series?.length ?? 0) >= 2)
  let series: SeriesPoint[] = []
  if (withSeries.length > 0) {
    const len = Math.min(...withSeries.map((r) => r.series!.length))
    const flat = invested - withSeries.reduce((s, r) => s + r.allocation, 0)
    const refDates = withSeries[0].series!
    series = Array.from({ length: len }, (_, k) => ({
      date: refDates[refDates.length - len + k].date,
      value: withSeries.reduce((s, r) => {
        const arr = r.series!
        return s + arr[arr.length - len + k].value
      }, flat),
    }))
  }

  return {
    mode,
    timeframe,
    invested,
    endingValue,
    totalReturnDollars,
    totalReturnPct,
    positions: results,
    series,
    sources,
  }
}
