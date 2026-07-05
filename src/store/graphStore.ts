import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import type { AppNode, AppEdge } from '../lib/types'
import { DEFAULT_GROUP_COLOR } from '../lib/groupColors'

export type CanvasTool = 'select' | 'hand'

type GraphState = {
  nodes: AppNode[]
  edges: AppEdge[]
  tool: CanvasTool
  setTool: (tool: CanvasTool) => void
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: AppNode) => void
  updateNodeData: <T extends AppNode['data']>(id: string, data: Partial<T>) => void
  removeNode: (id: string) => void
  groupNodes: (ids: string[], label?: string) => void
  ungroup: (groupId: string) => void
  duplicateNodes: (ids: string[]) => void
  clearGraph: () => void
  resetGraph: () => void
}

const initialNodes: AppNode[] = [
  {
    id: 'stock-1',
    type: 'stock',
    position: { x: 80, y: 120 },
    data: { ticker: 'VOO', allocation: 5000 },
  },
  {
    id: 'stock-2',
    type: 'stock',
    position: { x: 80, y: 280 },
    data: { ticker: 'AAPL', allocation: 2500 },
  },
  {
    id: 'timeline-1',
    type: 'timeline',
    position: { x: 480, y: 180 },
    data: { mode: 'backtest', timeframe: '5Y' },
  },
  {
    id: 'portfolio-1',
    type: 'portfolio',
    position: { x: 860, y: 180 },
    data: {},
  },
]

const initialEdges: AppEdge[] = [
  { id: 'e1', source: 'stock-1', target: 'timeline-1' },
  { id: 'e2', source: 'stock-2', target: 'timeline-1' },
  { id: 'e3', source: 'timeline-1', target: 'portfolio-1' },
]

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: initialEdges,
      tool: 'select',
      setTool: (tool) => set({ tool }),
      onNodesChange: (changes) => {
        // Deleting a group must not orphan its children — unparent them at
        // their absolute position first, so the group dissolves instead.
        let nodes = get().nodes
        const removedGroups = new Map(
          changes
            .filter((c) => c.type === 'remove')
            .map((c) => nodes.find((n) => n.id === c.id))
            .filter((n): n is AppNode => n?.type === 'group')
            .map((g) => [g.id, g]),
        )
        if (removedGroups.size > 0) {
          nodes = nodes.map((n) => {
            const parent = n.parentId ? removedGroups.get(n.parentId) : undefined
            if (!parent) return n
            return {
              ...n,
              parentId: undefined,
              position: {
                x: n.position.x + parent.position.x,
                y: n.position.y + parent.position.y,
              },
            } as AppNode
          })
        }
        set({ nodes: applyNodeChanges(changes, nodes) as AppNode[] })
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) })
      },
      onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) })
      },
      addNode: (node) => {
        set({ nodes: [...get().nodes, node] })
      },
      updateNodeData: (id, data) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? ({ ...n, data: { ...n.data, ...data } } as AppNode) : n,
          ),
        })
      },
      removeNode: (id) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        })
      },
      groupNodes: (ids, label = 'Group') => {
        const nodes = get().nodes
        // Only top-level, non-group nodes can be grouped
        const members = nodes.filter(
          (n) => ids.includes(n.id) && n.type !== 'group' && !n.parentId,
        )
        if (members.length < 2) return

        // Tight Figma-section-style frame — the name tab floats above it,
        // so no extra header space inside the bounds.
        const PAD = 16
        const rects = members.map((n) => ({
          x: n.position.x,
          y: n.position.y,
          w: n.measured?.width ?? 250,
          h: n.measured?.height ?? 200,
        }))
        const minX = Math.min(...rects.map((r) => r.x)) - PAD
        const minY = Math.min(...rects.map((r) => r.y)) - PAD
        const maxX = Math.max(...rects.map((r) => r.x + r.w)) + PAD
        const maxY = Math.max(...rects.map((r) => r.y + r.h)) + PAD

        const groupId = `group-${Math.random().toString(36).slice(2, 8)}`
        const group: AppNode = {
          id: groupId,
          type: 'group',
          position: { x: minX, y: minY },
          width: maxX - minX,
          height: maxY - minY,
          data: { label, color: DEFAULT_GROUP_COLOR },
        }
        const memberIds = new Set(members.map((m) => m.id))
        set({
          // Parent nodes must come before their children in the array
          nodes: [
            group,
            ...nodes.map((n) =>
              memberIds.has(n.id)
                ? ({
                    ...n,
                    parentId: groupId,
                    position: {
                      x: n.position.x - minX,
                      y: n.position.y - minY,
                    },
                    selected: false,
                  } as AppNode)
                : n,
            ),
          ],
        })
      },
      ungroup: (groupId) => {
        const nodes = get().nodes
        const group = nodes.find((n) => n.id === groupId)
        if (group?.type !== 'group') return
        set({
          nodes: nodes
            .filter((n) => n.id !== groupId)
            .map((n) =>
              n.parentId === groupId
                ? ({
                    ...n,
                    parentId: undefined,
                    position: {
                      x: n.position.x + group.position.x,
                      y: n.position.y + group.position.y,
                    },
                  } as AppNode)
                : n,
            ),
        })
      },
      duplicateNodes: (ids) => {
        const { nodes, edges } = get()
        const rand = () => Math.random().toString(36).slice(2, 8)

        // Duplicating a group brings its children along
        const idSet = new Set(ids)
        for (const n of nodes) {
          if (n.parentId && idSet.has(n.parentId)) idSet.add(n.id)
        }

        const idMap = new Map<string, string>()
        for (const oldId of idSet) {
          idMap.set(oldId, `${oldId.split('-')[0]}-${rand()}`)
        }

        // Filtering the original array keeps parents ahead of their children
        const clones = nodes
          .filter((n) => idSet.has(n.id))
          .map(
            (n) =>
              ({
                ...n,
                id: idMap.get(n.id)!,
                parentId:
                  n.parentId && idMap.has(n.parentId)
                    ? idMap.get(n.parentId)
                    : n.parentId,
                selected: false,
                dragging: false,
              }) as AppNode,
          )

        // Carry over edges that live entirely inside the duplicated set
        const cloneEdges = edges
          .filter((e) => idMap.has(e.source) && idMap.has(e.target))
          .map((e) => ({
            ...e,
            id: `e-${rand()}`,
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
          }))

        set({ nodes: [...nodes, ...clones], edges: [...edges, ...cloneEdges] })
      },
      clearGraph: () => {
        set({ nodes: [], edges: [] })
      },
      resetGraph: () => {
        set({ nodes: initialNodes, edges: initialEdges })
      },
    }),
    {
      name: 'portfolio-node-builder-graph',
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
      version: 1,
    },
  ),
)
