import type { Plugin } from "vue"
import { initializeDayjsPlugins } from "./composables/useDayjsInitializer"

import GGanttChart from "./components/GGanttChart.vue"
import GGanttRow from "./components/GGanttRow.vue"

import type {
  ColorScheme,
  GanttBarObject,
  GanttBarConfig,
  BarConnection,
  ChartRow,
  LabelColumnConfig,
  ConnectionType,
  ConnectionPattern,
  ConnectionSpeed,
  GanttMilestone,
  GanttBarDragEvent,
  GanttBarEvent,
  RowDragEvent,
  SortFunction,
  SortState,
  SortDirection,
  TimeUnit,
  MarkerConnection,
  DayOptionLabel,
  GanttBarConnection,
  BarMouseEvent,
  ConnectionStartEvent,
  ConnectionDragEvent,
  ConnectionCompleteEvent,
  ConnectionDeleteEvent,
  ConnectionRelation,
  LabelEditEvent,
  TimeaxisEvent,
  ExportOptions,
  ExportResult,
  ImportFormat,
  ImportOptions,
  ImportResult,
  JiraData,
  SpreadsheetRow,
  ConnectionLabelStyle,
  RangeSelectionEvent
} from "./types"

import "dayjs/locale/it"
import "dayjs/locale/en"
import "dayjs/locale/fr"
import "dayjs/locale/de"
import "dayjs/locale/es"
import "dayjs/locale/pt"
import "dayjs/locale/ru"
import "dayjs/locale/zh-cn"
import "dayjs/locale/zh-tw"
import "dayjs/locale/ja"
import "dayjs/locale/ko"
import "dayjs/locale/nl"
import "dayjs/locale/pl"
import "dayjs/locale/cs"

export function extendDayjs() {
  initializeDayjsPlugins()
}

export type {
  ColorScheme,
  GanttBarObject,
  GanttBarConfig,
  BarConnection,
  ChartRow,
  LabelColumnConfig,
  ConnectionType,
  ConnectionPattern,
  ConnectionSpeed,
  GanttMilestone,
  GanttBarDragEvent,
  GanttBarEvent,
  RowDragEvent,
  SortFunction,
  SortState,
  SortDirection,
  TimeUnit,
  MarkerConnection,
  DayOptionLabel,
  GanttBarConnection,
  BarMouseEvent,
  ConnectionStartEvent,
  ConnectionDragEvent,
  ConnectionCompleteEvent,
  ConnectionDeleteEvent,
  ConnectionRelation,
  LabelEditEvent,
  TimeaxisEvent,
  ExportOptions,
  ExportResult,
  ImportFormat,
  ImportOptions,
  ImportResult,
  JiraData,
  SpreadsheetRow,
  ConnectionLabelStyle,
  RangeSelectionEvent
}
export { GGanttChart, GGanttRow }

export const hyvuegantt: Plugin = {
  install(app) {
    extendDayjs()
    app.component("GGanttChart", GGanttChart)
    app.component("GGanttRow", GGanttRow)
  }
}

export default hyvuegantt
