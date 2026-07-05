// Twelve Data client with localStorage cache + deterministic mock fallback.
// Free tier: 800 requests/day, 8/min. We request 10y of monthly closes per ticker
// and slice locally for shorter backtest windows + use full series for CAGR.

import { getTickerInfo } from './tickers'

const API_KEY = import.meta.env.VITE_TWELVE_DATA_KEY as string | undefined
const CACHE_PREFIX = 'td:v1:'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

export type PriceBar = {
  date: string // ISO yyyy-mm-dd
  close: number
}

type CacheEntry = {
  fetchedAt: number
  bars: PriceBar[]
}

export type PriceSource = 'live' | 'mock' | 'cache'

export type PriceSeries = {
  ticker: string
  bars: PriceBar[] // ascending order
  source: PriceSource
}

export const isUsingMockData = () => !API_KEY

// --- Cache ---------------------------------------------------------------

function readCache(ticker: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + ticker)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(ticker: string, bars: PriceBar[]) {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), bars }
    localStorage.setItem(CACHE_PREFIX + ticker, JSON.stringify(entry))
  } catch {
    /* quota or disabled — ignore */
  }
}

// --- Mock generator ------------------------------------------------------

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Box-Muller for normal samples
function gauss(rand: () => number) {
  const u = Math.max(rand(), 1e-9)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function generateMockBars(ticker: string, months = 120): PriceBar[] {
  const rand = mulberry32(hashSeed(ticker))
  // Per-ticker drift/vol so different tickers diverge visibly
  const annualReturn = 0.05 + rand() * 0.10 // 5%–15%
  const annualVol = 0.12 + rand() * 0.18 // 12%–30%
  const muM = annualReturn / 12
  const sigM = annualVol / Math.sqrt(12)

  const bars: PriceBar[] = []
  let price = 50 + rand() * 150
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const r = muM + sigM * gauss(rand)
    price = Math.max(0.5, price * (1 + r))
    bars.push({ date: d.toISOString().slice(0, 10), close: +price.toFixed(2) })
  }
  return bars
}

// --- Live fetch ----------------------------------------------------------

async function fetchLive(ticker: string): Promise<PriceBar[]> {
  if (!API_KEY) throw new Error('No API key')
  const url = new URL('https://api.twelvedata.com/time_series')
  // Crypto and spot commodities use pair symbols on Twelve Data
  url.searchParams.set('symbol', getTickerInfo(ticker)?.apiSymbol ?? ticker)
  url.searchParams.set('interval', '1month')
  url.searchParams.set('outputsize', '120')
  url.searchParams.set('order', 'ASC')
  url.searchParams.set('apikey', API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`)
  const body = await res.json()
  if (body.status === 'error') throw new Error(body.message || 'Twelve Data error')

  type Raw = { datetime: string; close: string }
  const values: Raw[] = body.values ?? []
  const bars = values
    .map((v) => ({ date: v.datetime, close: parseFloat(v.close) }))
    .filter((b) => Number.isFinite(b.close))
  if (bars.length === 0) throw new Error('No price data')
  return bars
}

// --- Public API ----------------------------------------------------------

const inflight = new Map<string, Promise<PriceSeries>>()

export async function getPriceSeries(ticker: string): Promise<PriceSeries> {
  const key = ticker.trim().toUpperCase()
  if (!key) throw new Error('Empty ticker')

  const cached = readCache(key)
  if (cached) {
    return { ticker: key, bars: cached.bars, source: 'cache' }
  }

  const existing = inflight.get(key)
  if (existing) return existing

  const p = (async (): Promise<PriceSeries> => {
    if (!API_KEY) {
      const bars = generateMockBars(key)
      writeCache(key, bars)
      return { ticker: key, bars, source: 'mock' }
    }
    try {
      const bars = await fetchLive(key)
      writeCache(key, bars)
      return { ticker: key, bars, source: 'live' }
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}
