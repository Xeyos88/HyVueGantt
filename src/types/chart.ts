import type { GanttBarObject } from "./bar"

export interface ChartRow {
  id?: string | number
  label: string
  bars: GanttBarObject[]
}

export type TimeUnit = "hour" | "day" | "date" | "week" | "month"
export type ConnectionType = "bezier" | "straight" | "squared"
export type ConnectionPattern = "solid" | "dot" | "dash" | "dashdot"
export type ConnectionSpeed = "slow" | "normal" | "fast"
export type SortDirection = "asc" | "desc" | "none"
export type LabelColumnField = "Id" | "Label" | "StartDate" | "EndDate" | "Duration"

export type SortFunction = (a: ChartRow, b: ChartRow) => number

export interface LabelColumnConfig {
  field: LabelColumnField | string
  sortable?: boolean
  valueGetter?: (row: ChartRow) => string | number
  sortFn?: SortFunction
}

export interface SortState {
  column: string
  direction: SortDirection
}

export interface TimeaxisUnit {
  label: string
  value?: string
  date: Date
  width?: string
}
