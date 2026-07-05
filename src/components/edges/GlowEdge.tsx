import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

// Standard bezier edge with a pulse of light traveling along it — a soft
// blurred halo under a bright core, both riding the path via SMIL
// animateMotion.
export function GlowEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <circle
        r={6}
        fill="var(--color-accent)"
        opacity={0.25}
        style={{ filter: 'blur(4px)' }}
      >
        <animateMotion dur="2.4s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle
        r={2}
        fill="#dbeafe"
        style={{ filter: 'drop-shadow(0 0 4px var(--color-accent))' }}
      >
        <animateMotion dur="2.4s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  )
}
