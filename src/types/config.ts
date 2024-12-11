import type { ComputedRef, Ref, ToRefs } from "vue"
import type { ConnectionPattern, ConnectionSpeed, ConnectionType, TimeUnit } from "./chart"
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
  highlightedUnits?: number[]
  font?: string
  labelColumnTitle?: string
  labelColumnWidth?: string
  commands?: boolean
  enableMinutes?: boolean
  enableConnections?: boolean
  defaultConnectionType?: ConnectionType
  defaultConnectionColor?: string
  defaultConnectionPattern?: ConnectionPattern
  defaultConnectionAnimated?: boolean
  defaultConnectionAnimationSpeed?: ConnectionSpeed
  maxRows?: number
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
}
