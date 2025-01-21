import type { Plugin } from "vue"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isBetween from "dayjs/plugin/isBetween.js"
import weekOfYear from "dayjs/plugin/weekOfYear"
import advancedFormat from "dayjs/plugin/advancedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import dayOfYear from "dayjs/plugin/dayOfYear.js"
import localizedFormat from "dayjs/plugin/localizedFormat"
import type { ColorScheme } from "./types"

import GGanttChart from "./components/GGanttChart.vue"
import GGanttRow from "./components/GGanttRow.vue"
import type {
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
  SortDirection
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
import "dayjs/locale/ar"
import "dayjs/locale/hi"
import "dayjs/locale/tr"
import "dayjs/locale/nl"
import "dayjs/locale/pl"
import "dayjs/locale/cs"
import "dayjs/locale/hu"
import "dayjs/locale/ro"
import "dayjs/locale/bg"
import "dayjs/locale/sr"
import "dayjs/locale/sr-cyrl"
import "dayjs/locale/af"
import "dayjs/locale/az"
import "dayjs/locale/be"
import "dayjs/locale/bs"
import "dayjs/locale/ca"
import "dayjs/locale/da"
import "dayjs/locale/el"
import "dayjs/locale/et"
import "dayjs/locale/fi"
import "dayjs/locale/gl"
import "dayjs/locale/he"
import "dayjs/locale/hr"
import "dayjs/locale/is"
import "dayjs/locale/ka"
import "dayjs/locale/kk"
import "dayjs/locale/ky"
import "dayjs/locale/lt"
import "dayjs/locale/lv"
import "dayjs/locale/mk"
import "dayjs/locale/mn"
import "dayjs/locale/mt"
import "dayjs/locale/nb"
import "dayjs/locale/nn"
import "dayjs/locale/pt-br"
import "dayjs/locale/sk"
import "dayjs/locale/sl"
import "dayjs/locale/sq"
import "dayjs/locale/sv"
import "dayjs/locale/ta"
import "dayjs/locale/th"
import "dayjs/locale/uk"
import "dayjs/locale/uz"
import "dayjs/locale/vi"
import "dayjs/locale/zh-hk"
import "dayjs/locale/zh-tw"

export function extendDayjs() {
  dayjs.extend(isSameOrBefore)
  dayjs.extend(isSameOrAfter)
  dayjs.extend(isBetween)
  dayjs.extend(customParseFormat)
  dayjs.extend(weekOfYear)
  dayjs.extend(isoWeek)
  dayjs.extend(advancedFormat)
  dayjs.extend(dayOfYear)
  dayjs.extend(localizedFormat)
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
  SortDirection
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
