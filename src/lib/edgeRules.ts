// The only meaningful data flows: assets feed timelines (directly or
// through an Earn node), timelines feed portfolios. Anything else
// (stock→portfolio, timeline→timeline, earn→portfolio, …) is inert — the
// portfolio math never reads it. Accepts plain strings since React Flow's
// node lookup is not narrowed to our node types.
export function isFunctionalEdge(
  source: string | undefined,
  target: string | undefined,
): boolean {
  return (
    (source === 'stock' && target === 'timeline') ||
    (source === 'stock' && target === 'earn') ||
    (source === 'earn' && target === 'timeline') ||
    (source === 'timeline' && target === 'portfolio')
  )
}
