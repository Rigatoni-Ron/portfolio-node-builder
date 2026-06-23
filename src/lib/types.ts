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

export type StockNode = Node<StockNodeData, 'stock'>
export type TimelineNode = Node<TimelineNodeData, 'timeline'>
export type PortfolioNode = Node<PortfolioNodeData, 'portfolio'>

export type AppNode = StockNode | TimelineNode | PortfolioNode
export type AppEdge = Edge
