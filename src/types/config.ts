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
  TimeUnit,
  MarkerConnection,
  TimeaxisEvent,
  ConnectionRelation
} from "./chart"
import type { ColorScheme } from "./style"
import type { ExportOptions } from "./export"
import type { ImportFormat } from "./import"
import type { ConnectionLabelStyle } from "./bar"

export interface GGanttChartProps {
  chartStart: string | Date
  chartEnd: string | Date
  precision?: TimeUnit
  barStart: string
  barEnd: string
  currentTime?: boolean
  currentTimeLabel?: string
  pointerMarker?: boolean
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
  enableConnectionCreation?: boolean
  enableConnectionDeletion?: boolean
  defaultConnectionType?: ConnectionType
  defaultConnectionColor?: string
  defaultConnectionPattern?: ConnectionPattern
  defaultConnectionAnimated?: boolean
  defaultConnectionAnimationSpeed?: ConnectionSpeed
  defaultConnectionRelation?: ConnectionRelation
  defaultConnectionLabel?: string
  defaultConnectionLabelAlwaysVisible?: boolean
  defaultConnectionLabelStyle?: ConnectionLabelStyle
  maxRows?: number
  initialSort?: SortState
  initialRows?: ChartRow[]
  sortable?: boolean
  labelResizable?: boolean
  milestones?: GanttMilestone[]
  timeaxisEvents?: TimeaxisEvent[]
  showEventsAxis?: boolean
  eventsAxisHeight?: number
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
  enableRowDragAndDrop?: boolean
  markerConnection?: MarkerConnection
  showLabel?: boolean
  showProgress?: boolean
  defaultProgressResizable?: boolean
  utc?: boolean
  barLabelEditable?: boolean
  exportEnabled?: boolean
  exportOptions?: ExportOptions
  showImporter?: boolean
  importerTitle?: string
  importerDefaultFormat?: ImportFormat
  importerAllowedFormats?: ImportFormat[]
  importerBarStartField?: string
  importerBarEndField?: string
  baseUnitWidth?: number
  defaultZoom?: number
  tick?: number
}

export type GGanttChartConfig = ToRefs<Required<GGanttChartProps>> & {
  colors: ComputedRef<ColorScheme>
  chartSize: {
    width: Ref<number>
    height: Ref<number>
  }
}

export type GGanttBooleanConfig = {
  commands?: boolean
  enableMinutes?: boolean
  sortable?: boolean
}

export interface GanttCommandSlot {
  zoomIn: () => void
  zoomOut: () => void
  scrollRowUp: () => void
  scrollRowDown: () => void
  expandAllGroups: () => void
  collapseAllGroups: () => void
  handleToStart: () => void
  handleBack: () => void
  handleScroll: () => void
  handleForward: () => void
  handleToEnd: () => void
  undo: () => void
  redo: () => void
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  isAtTop: Ref<boolean>
  isAtBottom: Ref<boolean>
  zoomLevel: Ref<number>
}
