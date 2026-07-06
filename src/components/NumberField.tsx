import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  className?: string
}

// Controlled number input that keeps a string draft while editing, so the
// field can be emptied (a bare `value={number}` snaps back to 0 and can
// never be cleared). Partial entries like "" or "-" commit 0 to the store
// but stay visible; blur normalizes the text.
export function NumberField({ value, onChange, step, min, className }: Props) {
  const [draft, setDraft] = useState(String(value))
  const lastEmitted = useRef(value)

  // Resync only when the value changes from outside our own edits
  // (e.g. an Earn strategy switch resetting the default APR).
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setDraft(String(value))
      lastEmitted.current = value
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setDraft(text)
    const num = text === '' || text === '-' ? 0 : Number(text)
    if (!Number.isNaN(num)) {
      lastEmitted.current = num
      onChange(num)
    }
  }

  const handleBlur = () => {
    const num = draft === '' || draft === '-' ? 0 : Number(draft)
    setDraft(Number.isNaN(num) ? '0' : String(num))
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`font-mono ${className ?? ''}`}
    />
  )
}
