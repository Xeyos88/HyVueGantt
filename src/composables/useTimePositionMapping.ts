import type { GGanttChartConfig } from "../types"
import { computed } from "vue"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import { ganttWidth } from "./useSimpleStore"

/**
 * A composable that handles the bi-directional mapping between time values and pixel positions.
 * This utility is essential for accurate positioning of chart elements and handling user interactions.
 *
 * @param config - Optional Gantt chart configuration. Uses default config if not provided
 * @returns Object containing mapping functions between time and position
 */
export default function useTimePositionMapping(config: GGanttChartConfig = provideConfig()) {
  const { dateFormat } = config
  const { chartStartDayjs, chartEndDayjs, toDayjs, format } = useDayjsHelper(config)

  /**
   * Calculates the total duration of the chart in minutes.
   * Used as a base for position calculations.
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
    const width = ganttWidth.value || 0
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
    const width = ganttWidth.value || 0
    const diffFromStart = (xPos / width) * totalNumOfMinutes.value
    return format(chartStartDayjs.value.add(diffFromStart, "minutes"), dateFormat.value)
  }

  return {
    mapTimeToPosition,
    mapPositionToTime
  }
}
