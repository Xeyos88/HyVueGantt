import type { GGanttChartConfig } from "../types"
import { computed } from "vue"

import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"

/**
 * A composable that manages mapping between time values and pixel positions in the Gantt chart
 * Provides utilities for converting between dates and x-coordinates
 * @param config - Gantt chart configuration object (optional, uses default if not provided)
 * @returns Object containing mapping functions
 */
export default function useTimePositionMapping(config: GGanttChartConfig = provideConfig()) {
  const { dateFormat, chartSize } = config
  const { chartStartDayjs, chartEndDayjs, toDayjs, format } = useDayjsHelper(config)

  /**
   * Computes total number of minutes between chart start and end
   */
  const totalNumOfMinutes = computed(() => {
    return chartEndDayjs.value.diff(chartStartDayjs.value, "minutes")
  })

  /**
   * Converts a time value to x-coordinate position
   * @param time - Time value to convert
   * @returns X-coordinate in pixels
   */
  const mapTimeToPosition = (time: string) => {
    const width = chartSize.width.value || 0
    const diffFromStart = toDayjs(time).diff(chartStartDayjs.value, "minutes", true)
    const position = Math.ceil((diffFromStart / totalNumOfMinutes.value) * width)

    return position
  }

  /**
   * Converts x-coordinate position to time value
   * @param xPos - X-coordinate in pixels
   * @returns Formatted time string
   */
  const mapPositionToTime = (xPos: number) => {
    const width = chartSize.width.value || 0
    const diffFromStart = (xPos / width) * totalNumOfMinutes.value
    return format(chartStartDayjs.value.add(diffFromStart, "minutes"), dateFormat.value)
  }

  return {
    mapTimeToPosition,
    mapPositionToTime
  }
}
