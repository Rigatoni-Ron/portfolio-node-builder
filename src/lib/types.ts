import type { Node, Edge } from '@xyflow/react'

export type Timeframe = '1Y' | '3Y' | '5Y' | '10Y'
export type TimelineMode = 'backtest' | 'projection'

export type StockNodeData = {
  ticker: string
  allocation: number
}

export type TimelineNodeData = {
  mode: TimelineMode
  timeframe: Timeframe
}

export type PortfolioNodeData = Record<string, never>

export type EarnStrategy = 'hold' | 'yield'

export type EarnNodeData = {
  strategy: EarnStrategy
  apr: number // annual percent yield applied on top of price returns
}

export type GroupNodeData = {
  label: string
  color?: string // one of GROUP_COLORS; undefined falls back to neutral
}

export type StockNode = Node<StockNodeData, 'stock'>
export type TimelineNode = Node<TimelineNodeData, 'timeline'>
export type PortfolioNode = Node<PortfolioNodeData, 'portfolio'>
export type EarnNode = Node<EarnNodeData, 'earn'>
export type GroupNode = Node<GroupNodeData, 'group'>

export type AppNode =
  | StockNode
  | TimelineNode
  | PortfolioNode
  | EarnNode
  | GroupNode
export type AppEdge = Edge
