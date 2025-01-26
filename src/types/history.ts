import type { ChartRow } from "./chart"

export interface HistoryState {
  rows: ChartRow[]
  expandedGroups: Set<string | number>
  customOrder: Map<string | number, number>
  timestamp: number
}
