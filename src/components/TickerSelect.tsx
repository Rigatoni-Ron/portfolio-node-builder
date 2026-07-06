import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TICKERS, TICKER_BADGE_CLASSES, type TickerInfo } from '../lib/tickers'

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
  const [menuPos, setMenuPos] = useState<{
    left: number
    top: number
    width: number
  } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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

  // Anchor the portaled menu to the input. Screen coords (fixed position)
  // so it stays put regardless of the node's own overflow clip.
  useLayoutEffect(() => {
    if (open && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setMenuPos({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 288) })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      // The menu is portaled outside rootRef, so check it separately
      if (
        rootRef.current?.contains(target) ||
        listRef.current?.contains(target)
      )
        return
      setOpen(false)
      setQuery('')
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
        ref={inputRef}
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
        className="nodrag w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm tracking-wider text-text outline-none focus:border-accent"
        placeholder={value ? undefined : 'Search ticker or name'}
      />

      {open &&
        menuPos &&
        createPortal(
        <ul
          ref={listRef}
          style={{
            position: 'fixed',
            left: menuPos.left,
            top: menuPos.top,
            width: menuPos.width,
          }}
          className="nodrag nowheel z-50 max-h-60 overflow-y-auto rounded-lg border border-border-strong bg-surface shadow-xl"
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
                  <span className="text-sm tracking-wider text-text">
                    {t.symbol}
                  </span>
                  <span
                    className={`rounded-full px-2 py-px text-[11px] font-medium ${TICKER_BADGE_CLASSES[t.type]}`}
                  >
                    {t.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-text-muted">
                    {t.name}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-text-muted">
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
                <span className="text-sm tracking-wider text-text">
                  {customSymbol}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-text-muted">
                  Use custom ticker
                </span>
              </button>
            </li>
          )}

          {optionCount === 0 && (
            <li className="px-3 py-2 text-[11px] text-text-muted">No matches</li>
          )}
        </ul>,
          document.body,
        )}
    </div>
  )
}
