export interface MarketEvent {
  id: string
  title: string
  description: string
  importance: 'high' | 'medium' | 'low'
  impact: 'positive' | 'negative' | 'neutral'
  category: string
  timestamp: string
  source: string
}

export interface HotspotAttribution {
  id: string
  symbol: string
  name: string
  change: number
  changePercent: number
  volume: number
  attribution: string
  confidence: number
  timestamp: string
}

export interface StockPool {
  id: string
  name: string
  description: string
  symbols: string[]
  createdAt: string
  updatedAt: string
}

export interface MarketBriefing {
  date: string
  events: MarketEvent[]
  hotspots: HotspotAttribution[]
  summary: string
}
