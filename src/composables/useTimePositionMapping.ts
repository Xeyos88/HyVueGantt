import type { GGanttChartConfig } from "../types"
import { computed, ref, watch } from "vue"
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

  // Cache for position calculations
  const timeToPositionCache = ref(new Map<string, number>())
  const positionToTimeCache = ref(new Map<string, string>())
  
  // Cache key based on chart configuration
  const cacheKey = ref('')
  
  /**
   * Calculates the total duration of the chart in minutes.
   * Used as a base for position calculations.
   */
  const totalNumOfMinutes = computed(() => {
    return chartEndDayjs.value.diff(chartStartDayjs.value, "minutes")
  })

  // Update cache key when chart parameters change
  watch([chartStartDayjs, chartEndDayjs, ganttWidth], () => {
    const newCacheKey = `${chartStartDayjs.value.format()}-${chartEndDayjs.value.format()}-${ganttWidth.value}`
    if (cacheKey.value !== newCacheKey) {
      cacheKey.value = newCacheKey
      timeToPositionCache.value.clear()
      positionToTimeCache.value.clear()
    }
  }, { immediate: true })

  /**
   * Converts a time value to x-coordinate position with caching
   * @param time - Time value to convert
   * @returns X-coordinate in pixels
   */
  const mapTimeToPosition = (time: string) => {
    // Check cache first
    const cached = timeToPositionCache.value.get(time)
    if (cached !== undefined) {
      return cached
    }

    const width = ganttWidth.value || 0
    const diffFromStart = toDayjs(time).diff(chartStartDayjs.value, "minutes", true)
    const position = Math.ceil((diffFromStart / totalNumOfMinutes.value) * width)

    // Cache the result
    timeToPositionCache.value.set(time, position)
    
    // Limit cache size to prevent memory leaks
    if (timeToPositionCache.value.size > 1000) {
      const firstKey = timeToPositionCache.value.keys().next().value
      if (firstKey) {
        timeToPositionCache.value.delete(firstKey)
      }
    }

    return position
  }

  /**
   * Converts x-coordinate position to time value with caching
   * @param xPos - X-coordinate in pixels
   * @returns Formatted time string
   */
  const mapPositionToTime = (xPos: number) => {
    const posKey = xPos.toString()
    
    // Check cache first
    const cached = positionToTimeCache.value.get(posKey)
    if (cached !== undefined) {
      return cached
    }

    const width = ganttWidth.value || 0
    const diffFromStart = (xPos / width) * totalNumOfMinutes.value
    const result = format(chartStartDayjs.value.add(diffFromStart, "minutes"), dateFormat.value) as string

    // Cache the result
    positionToTimeCache.value.set(posKey, result)
    
    // Limit cache size to prevent memory leaks
    if (positionToTimeCache.value.size > 1000) {
      const firstKey = positionToTimeCache.value.keys().next().value
      if (firstKey) {
        positionToTimeCache.value.delete(firstKey)
      }
    }

    return result
  }

  return {
    mapTimeToPosition,
    mapPositionToTime
  }
}
