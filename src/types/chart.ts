import type { GanttBarObject } from "./bar"

export interface ChartRow {
  label: string
  bars: GanttBarObject[]
}

export type TimeUnit = "hour" | "day" | "date" | "week" | "month"
export type ConnectionType = "bezier" | "straight" | "squared"
export type ConnectionPattern = "solid" | "dot" | "dash" | "dashdot"
export type ConnectionSpeed = "slow" | "normal" | "fast"
export type SortDirection = "asc" | "desc" | "none"

export interface TimeaxisUnit {
  label: string
  value?: string
  date: Date
  width?: string
}
