import { motion } from 'motion/react'

// Segmented control whose selection pill springs to the active option.
// The pill animates percentage offsets, so it stays exact at any canvas zoom.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  const n = options.length
  const idx = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div className="rounded-md border border-border bg-surface-2 p-1">
      <div className="relative">
        <motion.div
          className="absolute inset-y-0 rounded bg-accent/20"
          style={{ width: `${100 / n}%` }}
          initial={false}
          animate={{ left: `${(idx * 100) / n}%` }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
        />
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                value === o.value
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
