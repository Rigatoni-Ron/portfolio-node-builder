import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useGraphStore } from '../store/graphStore'
import { StockNode } from './nodes/StockNode'
import { TimelineNode } from './nodes/TimelineNode'
import { PortfolioNode } from './nodes/PortfolioNode'
import { GroupNode } from './nodes/GroupNode'
import { Toolbar } from './Toolbar'

const nodeTypes = {
  stock: StockNode,
  timeline: TimelineNode,
  portfolio: PortfolioNode,
  group: GroupNode,
}

function CanvasInner() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const onNodesChange = useGraphStore((s) => s.onNodesChange)
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange)
  const onConnect = useGraphStore((s) => s.onConnect)

  const defaultEdgeOptions = useMemo(
    () => ({ animated: false, style: { strokeWidth: 1.5 } }),
    [],
  )

  return (
    <div className="relative h-full w-full">
      <Toolbar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        proOptions={{ hideAttribution: false }}
        // Figma-style controls: left-drag marquee-selects, trackpad scroll
        // pans, pinch zooms, middle/right mouse button pans
        panOnDrag={[1, 2]}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnScroll
        zoomOnScroll={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2a2b33"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
