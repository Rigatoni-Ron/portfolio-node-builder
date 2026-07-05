import { useLayoutEffect, useRef, useState } from 'react'

// Tracks an element's rendered size via ResizeObserver.
// Returns { width: 0, height: 0 } until the first measurement.
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [bounds, setBounds] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]
      setBounds(
        box
          ? { width: box.inlineSize, height: box.blockSize }
          : { width: entry.contentRect.width, height: entry.contentRect.height },
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, bounds] as const
}
