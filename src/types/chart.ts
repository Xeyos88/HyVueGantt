import type { GanttBarConnection, GanttBarObject } from "./bar"

export interface ChartRow {
  id?: string | number
  label: string
  bars: GanttBarObject[]
  children?: ChartRow[]
  connections?: GanttBarConnection[]
  _originalNode?: any
}

export type TimeUnit = "hour" | "day" | "date" | "week" | "month"
export type ConnectionType = "bezier" | "straight" | "squared"
export type ConnectionPattern = "solid" | "dot" | "dash" | "dashdot"
export type ConnectionSpeed = "slow" | "normal" | "fast"
export type SortDirection = "asc" | "desc" | "none"
export type LabelColumnField = "Id" | "Label" | "StartDate" | "EndDate" | "Duration" | "Progress"
export type DayOptionLabel = "day" | "doy" | "name" | "number"
export type MarkerConnection = "none" | "forward" | "bidirectional"

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
  isHoliday?: boolean
  holidayName?: string
  holidayType?: string
}

export interface GanttMilestone {
  id: string
  date: string
  name: string
  description?: string
  color?: string
}

export interface TimeaxisResult {
  upperUnits: TimeaxisUnit[]
  lowerUnits: TimeaxisUnit[]
}

export interface TimeaxisData {
  result: TimeaxisResult
  globalMinuteStep: string[]
}

export interface GGanttTimeaxisInstance {
  timeaxisUnits: TimeaxisData
  timeaxisElement: HTMLElement | null
}

export interface Holiday {
  date: Date
  name: string
  type: string
}
