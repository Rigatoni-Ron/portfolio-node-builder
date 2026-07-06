import type { AppNode } from './types'
import type { XYPosition } from '@xyflow/react'

type NodeKind = NonNullable<AppNode['type']>

// Used until a node has been rendered and measured (matches w-64 / w-60 / w-72
// plus typical content height).
const FALLBACK_SIZE: Record<NodeKind, { width: number; height: number }> = {
  stock: { width: 256, height: 185 },
  earn: { width: 240, height: 140 },
  timeline: { width: 240, height: 185 },
  portfolio: { width: 288, height: 230 },
  group: { width: 320, height: 240 },
}

// Column order along the data flow: assets → earn → timeline → portfolio.
export const FLOW_ORDER: Record<NodeKind, number> = {
  stock: 0,
  earn: 1,
  timeline: 2,
  portfolio: 3,
  group: 4,
}

// Rendered size when available, else the type fallback.
export function nodeSize(n: AppNode): { width: number; height: number } {
  return n.measured?.width && n.measured?.height
    ? { width: n.measured.width, height: n.measured.height }
    : FALLBACK_SIZE[n.type ?? 'stock']
}

// Preferred column per node type, matching the seed layout (assets feed
// earn/timelines feed portfolios, left to right).
const COLUMN_X: Record<NodeKind, number> = {
  stock: 80,
  earn: 380,
  timeline: 480,
  portfolio: 860,
  group: 80, // groups are never placed via toolbar; keep the record total
}

const START_Y = 120
const MARGIN = 24 // minimum clearance between nodes
const STEP = 40 // vertical scan resolution
const MAX_ROWS = 60
const MAX_COLS = 8

type Rect = { x: number; y: number; width: number; height: number }

function nodeRect(n: AppNode, byId: Map<string, AppNode>): Rect {
  const measured =
    n.measured?.width && n.measured?.height
      ? { width: n.measured.width, height: n.measured.height }
      : FALLBACK_SIZE[n.type ?? 'stock']
  // Children of groups have parent-relative positions — resolve to absolute
  let { x, y } = n.position
  let parent = n.parentId ? byId.get(n.parentId) : undefined
  while (parent) {
    x += parent.position.x
    y += parent.position.y
    parent = parent.parentId ? byId.get(parent.parentId) : undefined
  }
  return { x, y, ...measured }
}

function overlaps(a: Rect, b: Rect, margin: number): boolean {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width + margin > b.x &&
    a.y < b.y + b.height + margin &&
    a.y + a.height + margin > b.y
  )
}

// First free slot scanning down the type's column, spilling into new columns
// to the right if the column is full.
export function findFreePosition(nodes: AppNode[], kind: NodeKind): XYPosition {
  const size = FALLBACK_SIZE[kind]
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const taken = nodes.map((n) => nodeRect(n, byId))

  for (let col = 0; col < MAX_COLS; col++) {
    const x = COLUMN_X[kind] + col * (size.width + MARGIN * 2)
    for (let row = 0; row < MAX_ROWS; row++) {
      const candidate = { x, y: START_Y + row * STEP, ...size }
      if (!taken.some((r) => overlaps(candidate, r, MARGIN))) {
        return { x: candidate.x, y: candidate.y }
      }
    }
  }
  return { x: COLUMN_X[kind], y: START_Y }
}
