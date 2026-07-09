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
import { EarnNode } from './nodes/EarnNode'
import { GroupNode } from './nodes/GroupNode'
import { GlowEdge } from './edges/GlowEdge'
import { Toolbar } from './Toolbar'
import { IntroTour, hasSeenIntro } from './IntroTour'

const nodeTypes = {
  stock: StockNode,
  timeline: TimelineNode,
  portfolio: PortfolioNode,
  earn: EarnNode,
  group: GroupNode,
}

// Overriding "default" makes every typeless edge render with the glow pulse
const edgeTypes = {
  default: GlowEdge,
}

function CanvasInner() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const onNodesChange = useGraphStore((s) => s.onNodesChange)
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange)
  const onConnect = useGraphStore((s) => s.onConnect)
  const duplicateNodes = useGraphStore((s) => s.duplicateNodes)
  const tool = useGraphStore((s) => s.tool)

  const defaultEdgeOptions = useMemo(
    () => ({ animated: false, style: { strokeWidth: 1.5 } }),
    [],
  )

  return (
    <div className={`relative h-full w-full ${tool === 'hand' ? 'tool-hand' : ''}`}>
      <Toolbar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // Figma-style option-drag: leave a copy behind at the drag origin
        onNodeDragStart={(event, _node, draggedNodes) => {
          if (event.altKey) duplicateNodes(draggedNodes.map((n) => n.id))
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionRadius={36}
        // During a pending intro tour the canvas starts hidden — an init
        // fitView on zero visible nodes degenerates to max-zoom at origin,
        // so the tour parks the viewport itself instead.
        fitView={hasSeenIntro()}
        proOptions={{ hideAttribution: true }}
        // Figma-style controls: left-drag marquee-selects (select tool) or
        // pans (hand tool), trackpad scroll pans, pinch zooms, middle/right
        // mouse button always pans
        panOnDrag={tool === 'hand' ? true : [1, 2]}
        selectionOnDrag={tool === 'select'}
        selectionMode={SelectionMode.Partial}
        // Shift-click (or Cmd/Ctrl-click) adds a node to the selection.
        // Box-select is handled by selectionOnDrag, so no keyed box-select.
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionKeyCode={null}
        nodesDraggable={tool !== 'hand'}
        elementsSelectable={tool !== 'hand'}
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
      <IntroTour />
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
