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

type GraphState = {
  nodes: AppNode[]
  edges: AppEdge[]
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: AppNode) => void
  updateNodeData: <T extends AppNode['data']>(id: string, data: Partial<T>) => void
  removeNode: (id: string) => void
  removeNodesByType: (type: NonNullable<AppNode['type']>) => void
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
      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] })
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
      removeNodesByType: (type) => {
        const removed = new Set(
          get().nodes.filter((n) => n.type === type).map((n) => n.id),
        )
        set({
          nodes: get().nodes.filter((n) => !removed.has(n.id)),
          edges: get().edges.filter(
            (e) => !removed.has(e.source) && !removed.has(e.target),
          ),
        })
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
