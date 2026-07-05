// The only meaningful data flows: stocks feed timelines, timelines feed
// portfolios. Anything else (stock→portfolio, timeline→timeline) is inert —
// the portfolio math never reads it. Accepts plain strings since React
// Flow's node lookup is not narrowed to our node types.
export function isFunctionalEdge(
  source: string | undefined,
  target: string | undefined,
): boolean {
  return (
    (source === 'stock' && target === 'timeline') ||
    (source === 'timeline' && target === 'portfolio')
  )
}
