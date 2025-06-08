import dayjs, { type Dayjs } from "dayjs"
import { computed } from "vue"

import type { GanttBarObject, GGanttChartConfig } from "../types"
import provideConfig from "../provider/provideConfig"
import { initializeDayjsPlugins } from "./useDayjsInitializer"

/**
 * Default date format used throughout the Gantt chart
 * Format includes both date and time components
 */
export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD HH:mm"

/**
 * A composable that provides date manipulation utilities using dayjs
 * Centralizes date handling logic for consistency across the Gantt chart
 * @param config - Optional Gantt chart configuration. If not provided, uses default config
 * @returns Object containing date manipulation methods and computed properties
 */
export default function useDayjsHelper(config: GGanttChartConfig = provideConfig()) {
  initializeDayjsPlugins()

  const { chartStart, chartEnd, barStart, barEnd, dateFormat, locale } = config

  /**
   * Computed property for the chart start date as a dayjs object
   */
  const chartStartDayjs = computed(() => toDayjs(chartStart.value))

  /**
   * Computed property for the chart end date as a dayjs object
   */
  const chartEndDayjs = computed(() => toDayjs(chartEnd.value))

  /**
   * Sets the locale for date formatting
   */
  dayjs.locale(locale.value)

  /**
   * Converts various input types to a dayjs object
   * Handles bar objects, date strings, and Date objects
   * @param input - Value to convert to dayjs object
   * @param startOrEnd - Optional parameter to specify which date to use from a bar object
   * @returns Dayjs object
   */
  const toDayjs = (input: string | Date | GanttBarObject, startOrEnd?: "start" | "end") => {
    let value
    if (startOrEnd !== undefined && typeof input !== "string" && !(input instanceof Date)) {
      value = startOrEnd === "start" ? input[barStart.value] : input[barEnd.value]
    }
    if (typeof input === "string") {
      value = input
    } else if (input instanceof Date) {
      return dayjs(input)
    }
    const format = dateFormat.value || DEFAULT_DATE_FORMAT
    return dayjs(value, format, true)
  }

  /**
   * Formats a date value according to specified pattern
   * @param input - Date value to format
   * @param pattern - Optional format pattern
   * @returns Formatted date string or Date object
   */
  const format = (input: string | Date | Dayjs, pattern?: string | false) => {
    if (pattern === false) {
      return input instanceof Date ? input : dayjs(input).toDate()
    }
    const inputDayjs = typeof input === "string" || input instanceof Date ? toDayjs(input) : input

    return inputDayjs.format(pattern)
  }

  /**
   * Calculates the difference in days between chart start and end dates
   * @returns Number of days between start and end dates
   */
  const diffDates = () => {
    return chartEndDayjs.value.diff(chartStartDayjs.value, "day")
  }

  return {
    chartStartDayjs,
    chartEndDayjs,
    toDayjs,
    format,
    diffDates
  }
}
