import { useLayoutEffect, useRef, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { GroupNode as GroupNodeT } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'
import { GROUP_COLORS, DEFAULT_GROUP_COLOR } from '../../lib/groupColors'

// Figma-section-style group: a flat tinted frame with the name on a small
// tab floating above the top-left corner. Swatches + ungroup appear beside
// the tab while the group is selected.
export function GroupNode({ id, data, selected }: NodeProps<GroupNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  const ungroup = useGraphStore((s) => s.ungroup)
  const color = data.color ?? DEFAULT_GROUP_COLOR

  // Size the input to its text. `ch` under-measures uppercase + letter-spaced
  // labels, so mirror the text in a hidden span and use its real width.
  const mirrorRef = useRef<HTMLSpanElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  useLayoutEffect(() => {
    if (mirrorRef.current) setLabelWidth(mirrorRef.current.offsetWidth)
  }, [data.label])

  return (
    <div className="relative h-full w-full">
      <div className="absolute -top-8 left-0 flex items-center gap-2">
        <div
          className="flex items-center rounded-md px-2 py-1"
          style={{ backgroundColor: `${color}26` }}
        >
          <span
            ref={mirrorRef}
            aria-hidden
            className="pointer-events-none invisible absolute whitespace-pre text-[11px] font-medium uppercase tracking-wider"
          >
            {data.label || 'Section'}
          </span>
          <input
            value={data.label}
            onChange={(e) =>
              updateNodeData<GroupNodeT['data']>(id, { label: e.target.value })
            }
            placeholder="Section"
            spellCheck={false}
            style={{ color, width: labelWidth + 2 }}
            className="nodrag bg-transparent text-[11px] font-medium uppercase tracking-wider outline-none placeholder:text-text-muted"
          />
        </div>

        {selected && (
          <>
            <div className="nodrag flex items-center gap-2 rounded-md border border-border bg-surface/95 p-2 shadow-lg">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    updateNodeData<GroupNodeT['data']>(id, { color: c })
                  }
                  aria-label={`Set group color to ${c}`}
                  className="h-3 w-3 rounded-full transition-transform hover:scale-125"
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      c === color
                        ? `0 0 0 1.5px var(--color-surface), 0 0 0 3px ${c}`
                        : undefined,
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => ungroup(id)}
              className="nodrag rounded-md border border-border bg-surface/95 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted shadow-lg transition-colors hover:text-negative"
            >
              Ungroup
            </button>
          </>
        )}
      </div>

      <div
        className="h-full w-full rounded-xl border transition-colors"
        style={{
          borderColor: selected ? color : `${color}55`,
          backgroundColor: `${color}14`,
        }}
      />
    </div>
  )
}
