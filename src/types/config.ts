import type { ComputedRef, Ref, ToRefs } from "vue"
import type {
  ChartRow,
  ConnectionPattern,
  ConnectionSpeed,
  ConnectionType,
  DayOptionLabel,
  GanttMilestone,
  LabelColumnConfig,
  SortState,
  TimeUnit
} from "./chart"
import type { ColorScheme } from "./style"

export interface GGanttChartProps {
  chartStart: string | Date
  chartEnd: string | Date
  precision?: TimeUnit
  barStart: string
  barEnd: string
  currentTime?: boolean
  currentTimeLabel?: string
  dateFormat?: string | false
  width?: string
  hideTimeaxis?: boolean
  colorScheme?: string | ColorScheme
  grid?: boolean
  pushOnOverlap?: boolean
  pushOnConnect?: boolean
  noOverlap?: boolean
  rowHeight?: number
  font?: string
  labelColumnTitle?: string
  labelColumnWidth?: number
  multiColumnLabel?: LabelColumnConfig[]
  commands?: boolean
  enableMinutes?: boolean
  enableConnections?: boolean
  defaultConnectionType?: ConnectionType
  defaultConnectionColor?: string
  defaultConnectionPattern?: ConnectionPattern
  defaultConnectionAnimated?: boolean
  defaultConnectionAnimationSpeed?: ConnectionSpeed
  maxRows?: number
  initialSort?: SortState
  initialRows?: ChartRow[]
  sortable?: boolean
  labelResizable?: boolean
  milestones?: GanttMilestone[]
  holidayHighlight?: string
  rowClass?: (row?: ChartRow) => string
  rowLabelClass?: (row?: ChartRow) => string
  dayOptionLabel?: DayOptionLabel[]
  highlightedHours?: number[]
  highlightedDaysInWeek?: number[]
  highlightedDaysInMonth?: number[]
  highlightedMonths?: number[]
  highlightedWeek?: number[]
  locale?: string
}

export type GGanttChartConfig = ToRefs<Required<GGanttChartProps>> & {
  colors: ComputedRef<ColorScheme>
  chartSize: {
    width: Ref<number>
    height: Ref<number>
  }
  widthNumber: Ref<number>
}

export type GGanttBooleanConfig = {
  commands?: boolean
  enableMinutes?: boolean
  sortable?: boolean
  labelResizable?: boolean
}
