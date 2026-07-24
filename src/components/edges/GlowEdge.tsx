import { BaseEdge, getBezierPath, useStore, type EdgeProps } from '@xyflow/react'
import { isFunctionalEdge } from '../../lib/edgeRules'

const PULSE_DUR = 2.4 // seconds per trip along the wire

// SMIL animations start when their element mounts, so edges created at
// different moments drift out of phase. Instead, schedule each animation to
// have begun at the most recent PULSE_DUR boundary on the svg's shared
// timeline — every bead ends up on the same global clock and they all
// arrive at their nodes in unison.
function syncToGlobalPhase(el: SVGElement | null) {
  const anim = el as SVGAnimationElement | null
  const svg = anim?.ownerSVGElement
  if (!anim || !svg) return
  try {
    anim.beginElementAt(-(svg.getCurrentTime() % PULSE_DUR))
  } catch {
    anim.beginElement()
  }
}

// Standard bezier edge with a pulse of light traveling along it — a soft
// blurred halo under a bright core, both riding the path via SMIL
// animateMotion. Edges the portfolio math ignores (e.g. stock→portfolio)
// render as a dashed red line with no pulse.
export function GlowEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const functional = useStore((s) => {
    const sourceType = s.nodeLookup.get(source)?.type
    const targetType = s.nodeLookup.get(target)?.type
    if (!isFunctionalEdge(sourceType, targetType)) return false
    // A portfolio only reads its first timeline edge — extras are inert
    if (sourceType === 'timeline' && targetType === 'portfolio') {
      const first = s.edges.find(
        (e) =>
          e.target === target && s.nodeLookup.get(e.source)?.type === 'timeline',
      )
      return first?.id === id
    }
    return true
  })
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  if (!functional) {
    // Stroke color lives in CSS (.edge-inert) so a :hover rule can brighten it
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className="edge-inert"
        style={{ ...style, strokeDasharray: '6 4' }}
      />
    )
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <circle
        r={6}
        fill="var(--color-accent)"
        opacity={0.25}
        style={{ filter: 'blur(4px)' }}
      >
        <animateMotion
          ref={syncToGlobalPhase}
          begin="indefinite"
          dur={`${PULSE_DUR}s`}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
      <circle
        r={2}
        fill="#dbeafe"
        style={{ filter: 'drop-shadow(0 0 4px var(--color-accent))' }}
      >
        <animateMotion
          ref={syncToGlobalPhase}
          begin="indefinite"
          dur={`${PULSE_DUR}s`}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </>
  )
}
