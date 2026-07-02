import { useEffect, useMemo, useRef, useState } from 'react'
import { TICKERS, getTickerInfo, type TickerInfo } from '../lib/tickers'

type Props = {
  value: string
  onChange: (ticker: string) => void
}

// Searchable combobox over the curated ticker catalog. Filters by symbol,
// name, or description; still allows free-form symbols not in the list.
export function TickerSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return TICKERS
    const symbolMatches: TickerInfo[] = []
    const textMatches: TickerInfo[] = []
    for (const t of TICKERS) {
      if (t.symbol.toLowerCase().startsWith(q)) symbolMatches.push(t)
      else if (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
        textMatches.push(t)
    }
    return [...symbolMatches, ...textMatches]
  }, [q])

  const customSymbol = query
    .trim()
    .toUpperCase()
    .replace(/[^A-Z.]/g, '')
    .slice(0, 6)
  const showCustom =
    customSymbol.length > 0 && !results.some((t) => t.symbol === customSymbol)
  const optionCount = results.length + (showCustom ? 1 : 0)

  const selectedInfo = getTickerInfo(value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const select = (symbol: string) => {
    onChange(symbol)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, optionCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active < results.length) select(results[active].symbol)
      else if (showCustom) select(customSymbol)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        value={open ? query : value}
        onFocus={() => {
          setOpen(true)
          setQuery('')
          setActive(0)
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          if (!open) setOpen(true)
        }}
        onKeyDown={onKeyDown}
        className="nodrag w-full rounded-md border border-border bg-surface-2 px-2 py-1.5 font-mono text-sm tracking-wider text-text outline-none focus:border-accent"
        placeholder={value ? undefined : 'Search ticker or name'}
      />

      {!open && selectedInfo && (
        <p className="mt-1 truncate text-[10px] leading-snug text-text-dim">
          {selectedInfo.name}
        </p>
      )}

      {open && (
        <ul
          ref={listRef}
          className="nodrag nowheel absolute left-0 top-full z-50 mt-1 max-h-60 w-72 overflow-y-auto rounded-lg border border-border-strong bg-surface shadow-xl"
        >
          {results.map((t, i) => (
            <li key={t.symbol} data-index={i}>
              <button
                type="button"
                onClick={() => select(t.symbol)}
                onPointerEnter={() => setActive(i)}
                className={`block w-full px-3 py-2 text-left ${
                  active === i ? 'bg-accent-soft' : ''
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-sm tracking-wider text-text">
                    {t.symbol}
                  </span>
                  <span
                    className={`rounded px-1 py-px text-[9px] font-medium uppercase tracking-wider ${
                      t.type === 'ETF'
                        ? 'bg-accent-soft text-accent'
                        : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {t.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-text-muted">
                    {t.name}
                  </span>
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-text-dim">
                  {t.description}
                </span>
              </button>
            </li>
          ))}

          {showCustom && (
            <li data-index={results.length}>
              <button
                type="button"
                onClick={() => select(customSymbol)}
                onPointerEnter={() => setActive(results.length)}
                className={`block w-full px-3 py-2 text-left ${
                  active === results.length ? 'bg-accent-soft' : ''
                }`}
              >
                <span className="font-mono text-sm tracking-wider text-text">
                  {customSymbol}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-text-dim">
                  Use custom ticker
                </span>
              </button>
            </li>
          )}

          {optionCount === 0 && (
            <li className="px-3 py-2 text-[11px] text-text-dim">No matches</li>
          )}
        </ul>
      )}
    </div>
  )
}
