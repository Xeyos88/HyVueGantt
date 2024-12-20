import type { Plugin } from "vue"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isBetween from "dayjs/plugin/isBetween.js"
import weekOfYear from "dayjs/plugin/weekOfYear"
import advancedFormat from "dayjs/plugin/advancedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat.js"

import type { ColorScheme } from "./color-schemes"

import GGanttChart from "./components/GGanttChart.vue"
import GGanttRow from "./components/GGanttRow.vue"
import type { GanttBarObject, GanttBarConfig } from "./types"

export function extendDayjs() {
  dayjs.extend(isSameOrBefore)
  dayjs.extend(isSameOrAfter)
  dayjs.extend(isBetween)
  dayjs.extend(customParseFormat)
  dayjs.extend(weekOfYear)
  dayjs.extend(isoWeek)
  dayjs.extend(advancedFormat)
}

export type { ColorScheme, GanttBarObject, GanttBarConfig }
export { GGanttChart, GGanttRow }

export const hyvuegantt: Plugin = {
  install(app) {
    extendDayjs()
    app.component("GGanttChart", GGanttChart)
    app.component("GGanttRow", GGanttRow)
  }
}

export default hyvuegantt
