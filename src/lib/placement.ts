import type { AppNode } from './types'
import type { XYPosition } from '@xyflow/react'

type NodeKind = NonNullable<AppNode['type']>

// Used until a node has been rendered and measured (matches w-56 / w-60 / w-72
// plus typical content height).
const FALLBACK_SIZE: Record<NodeKind, { width: number; height: number }> = {
  stock: { width: 224, height: 215 },
  timeline: { width: 240, height: 185 },
  portfolio: { width: 288, height: 230 },
}

// Preferred column per node type, matching the seed layout (stocks feed
// timelines feed portfolios, left to right).
const COLUMN_X: Record<NodeKind, number> = {
  stock: 80,
  timeline: 480,
  portfolio: 860,
}

const START_Y = 120
const MARGIN = 24 // minimum clearance between nodes
const STEP = 40 // vertical scan resolution
const MAX_ROWS = 60
const MAX_COLS = 8

type Rect = { x: number; y: number; width: number; height: number }

function nodeRect(n: AppNode): Rect {
  const measured =
    n.measured?.width && n.measured?.height
      ? { width: n.measured.width, height: n.measured.height }
      : FALLBACK_SIZE[n.type ?? 'stock']
  return { x: n.position.x, y: n.position.y, ...measured }
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
  const taken = nodes.map(nodeRect)

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
