import type { NodeProps } from '@xyflow/react'
import type { GroupNode as GroupNodeT } from '../../lib/types'
import { useGraphStore } from '../../store/graphStore'

export function GroupNode({ id, data, selected }: NodeProps<GroupNodeT>) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  const ungroup = useGraphStore((s) => s.ungroup)

  return (
    <div
      className={`h-full w-full rounded-2xl border border-dashed bg-surface/30 transition-colors ${
        selected ? 'border-accent' : 'border-border-strong'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <input
          value={data.label}
          onChange={(e) =>
            updateNodeData<GroupNodeT['data']>(id, { label: e.target.value })
          }
          placeholder="Group name"
          className="nodrag w-full min-w-0 rounded bg-transparent text-[11px] font-medium uppercase tracking-wider text-text-muted outline-none placeholder:text-text-dim focus:text-text"
        />
        <button
          onClick={() => ungroup(id)}
          className="nodrag shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-dim transition-colors hover:text-negative"
        >
          Ungroup
        </button>
      </div>
    </div>
  )
}
