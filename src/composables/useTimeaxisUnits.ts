import { computed, ref, watch } from "vue"
import type { Dayjs, ManipulateType } from "dayjs"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import type { GGanttChartConfig, TimeaxisEvent, TimeaxisUnit, TimeUnit } from "../types"
import { useHolidays } from "./useHolidays"
import dayjs from "dayjs"
import { ganttWidth } from "./useSimpleStore"

/**
 * Base width for time unit elements (in pixels)
 * Used as the foundation for calculating actual widths with zoom
 */

/**
 * Zoom level constraints and defaults
 * Used to maintain readability and performance
 */
const MAX_ZOOM = 10
const MIN_ZOOM = 1

/**
 * Cache time-to-live in milliseconds
 * Entries older than this will be automatically removed
 */
const CACHE_TTL = 5 * 60 * 1000

/**
 * Extended time unit type that includes additional granularities
 * beyond the base TimeUnit type
 */
type ExtendedTimeUnit = TimeUnit | "year" | "isoWeek"

/**
 * Display format mapping for each time unit type
 * Defines how each unit should be formatted when displayed
 */
type DisplayFormat = {
  [key in TimeUnit | "year"]: string
}

/**
 * Mapping between time units for precision adjustments
 */
type PrecisionMapType = {
  [key in TimeUnit]: ExtendedTimeUnit
}

/**
 * Cache entry structure for storing calculated units
 */
interface CacheEntry {
  timestamp: number
  units: TimeaxisUnit[]
}

/**
 * Cache entry structure for storing calculated events
 */
interface EventsCacheEntry {
  timestamp: number
  events: TimeaxisEvent[]
}

/**
 * Cache structure for both lower and upper units
 */
interface TimeaxisCache {
  lower: Map<string, CacheEntry>
  upper: Map<string, CacheEntry>
  events: Map<string, EventsCacheEntry>
}

/**
 * Capitalizes the first letter of a string, handling Unicode characters
 * @param str - Input string to capitalize
 * @returns Capitalized string
 */
export const capitalizeString = (str: string): string => {
  if (!str) return str
  return str.normalize("NFD").replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase())
}

/**
 * Capitalizes the first letter of each word in a string
 * @param str - Input string to process
 * @returns String with capitalized words
 */
export const capitalizeWords = (str: string): string => {
  return str
    .split(/(\s+|\.|\,)/)
    .map((word) => {
      if (/^\p{L}/u.test(word)) {
        return capitalizeString(word)
      }
      return word
    })
    .join("")
}

/**
 * A composable that manages time axis units generation and display with optimized performance.
 * Features include:
 * - Efficient caching system for calculated units
 * - Dynamic zoom level management
 * - Automatic precision adjustment
 * - Performance optimizations for large datasets
 * - Timestamp-based calculations for week handling
 * - Events positioning and visualization on the third axis
 *
 * @param config - Optional Gantt chart configuration
 * @returns Object containing timeaxis state and control methods
 */
export default function useTimeaxisUnits(config: GGanttChartConfig = provideConfig()) {
  const { getHolidayInfo } = useHolidays(config)
  const {
    precision: configPrecision,
    holidayHighlight,
    locale,
    timeaxisEvents,
    baseUnitWidth,
    defaultZoom
  } = config

  const internalPrecision = ref<TimeUnit>(configPrecision.value)
  const zoomLevel = ref(defaultZoom.value)
  const processedTimeaxisEvents = ref<TimeaxisEvent[]>([])

  const cache: TimeaxisCache = {
    lower: new Map(),
    upper: new Map(),
    events: new Map()
  }

  /**
   * Display format configuration for time units
   */
  const displayFormats: DisplayFormat = {
    hour: "HH",
    date: "DD.MMM",
    day: "DD.MMM",
    week: "WW",
    month: "MMMM YYYY",
    year: "YYYY"
  }

  /**
   * Gets display format for a time unit
   * @param unit - Time unit
   * @returns Format string
   */
  const getDisplayFormat = (unit: ExtendedTimeUnit): string => {
    if (unit === "isoWeek") return displayFormats.week
    return displayFormats[unit as keyof DisplayFormat] || displayFormats.day
  }

  /**
   * Precision hierarchy from finest to coarsest
   */
  const precisionHierarchy: TimeUnit[] = ["hour", "day", "week", "month"]

  /**
   * Current unit width based on base width and zoom level
   */
  const unitWidth = computed(() => baseUnitWidth.value * zoomLevel.value)

  /**
   * Gets the next coarser precision level
   * @param currentPrecision - Time current precition
   * @returns Next precision
   */
  const getNextPrecision = (currentPrecision: TimeUnit): TimeUnit => {
    const currentIndex = precisionHierarchy.indexOf(currentPrecision)
    if (currentIndex < precisionHierarchy.length - 1) {
      return precisionHierarchy[currentIndex + 1]!
    }
    return currentPrecision
  }

  /**
   * Gets the next finer precision level
   * @param currentPrecision - Time current precition
   * @returns Previous precision
   */
  const getPreviousPrecision = (currentPrecision: TimeUnit): TimeUnit => {
    const currentIndex = precisionHierarchy.indexOf(currentPrecision)
    const configIndex = precisionHierarchy.indexOf(configPrecision.value)
    if (currentIndex > 0 && currentIndex > configIndex) {
      return precisionHierarchy[currentIndex - 1]!
    }
    return currentPrecision
  }

  /**
   * Upper precision level based on current precision
   */
  const upperPrecision = computed(() => {
    const precisionMap: PrecisionMapType = {
      hour: "day",
      day: "month",
      date: "month",
      week: "month",
      month: "year"
    }
    return precisionMap[internalPrecision.value] || "month"
  })

  /**
   * Generates cache key for unit storage
   */
  const getCacheKey = (startDate: Dayjs, endDate: Dayjs, precision: TimeUnit, zoom: number) => {
    return `${startDate.valueOf()}-${endDate.valueOf()}-${precision}-${zoom}`
  }

  /**
   * Generates cache key for events storage
   */
  const getEventsCacheKey = (startDate: Dayjs, endDate: Dayjs, zoom: number) => {
    return `${startDate.valueOf()}-${endDate.valueOf()}-${zoom}`
  }

  /**
   * Retrieves units from cache if available and valid
   */
  const getFromCache = (cacheMap: Map<string, CacheEntry>, key: string): TimeaxisUnit[] | null => {
    const entry = cacheMap.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cacheMap.delete(key)
      return null
    }

    return entry.units
  }

  /**
   * Retrieves events from cache if available and valid
   */
  const getEventsFromCache = (key: string): TimeaxisEvent[] | null => {
    const entry = cache.events.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.events.delete(key)
      return null
    }

    return entry.events
  }

  /**
   * Stores units in cache with timestamp
   */
  const setInCache = (cacheMap: Map<string, CacheEntry>, key: string, units: TimeaxisUnit[]) => {
    cacheMap.set(key, {
      timestamp: Date.now(),
      units
    })
  }

  /**
   * Stores events in cache with timestamp
   */
  const setEventsInCache = (key: string, events: TimeaxisEvent[]) => {
    cache.events.set(key, {
      timestamp: Date.now(),
      events
    })
  }

  /**
   * Maps time units to dayjs unit types
   */
  const getDayjsUnit = (unit: ExtendedTimeUnit): ManipulateType => {
    const unitMap: Record<ExtendedTimeUnit, ManipulateType> = {
      hour: "hour",
      day: "day",
      date: "day",
      week: "week",
      month: "month",
      year: "year",
      isoWeek: "week"
    }
    return unitMap[unit]
  }

  /**
   * Creates a time axis unit object
   */
  const createTimeaxisUnit = (moment: Dayjs, format: string, width: string): TimeaxisUnit => {
    const date = moment.toDate()
    const holidayInfo = holidayHighlight.value ? getHolidayInfo(date) : null
    const formattedLabel = moment.format(format)
    const capitalizedLabel = capitalizeWords(formattedLabel)

    return {
      label: capitalizedLabel,
      value: String(moment),
      date,
      width,
      isHoliday: holidayInfo?.isHoliday || false,
      holidayName: holidayInfo?.holidayName,
      holidayType: holidayInfo?.holidayType
    }
  }

  /**
   * Calculates position and dimensions for timeline events
   * @param events - Events to process and position
   * @returns Processed events with position and dimension information
   */
  const updateEventPositions = () => {
    if (!timeaxisEvents.value?.length) {
      processedTimeaxisEvents.value = []
      return
    }

    const { chartStartDayjs, chartEndDayjs } = useDayjsHelper(config)
    const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes")

    const eventsCacheKey = getEventsCacheKey(
      chartStartDayjs.value,
      chartEndDayjs.value,
      zoomLevel.value
    )

    const cachedEvents = getEventsFromCache(eventsCacheKey)
    if (cachedEvents) {
      processedTimeaxisEvents.value = cachedEvents
      return
    }

    const processedEvents = timeaxisEvents.value.map((event) => {
      const eventStartDayjs = dayjs(event.startDate)
      const eventEndDayjs = dayjs(event.endDate)

      if (
        eventEndDayjs.isBefore(chartStartDayjs.value) ||
        eventStartDayjs.isAfter(chartEndDayjs.value)
      ) {
        return {
          ...event,
          width: "0px",
          xPosition: 0
        }
      }

      const startTime = eventStartDayjs.isBefore(chartStartDayjs.value)
        ? chartStartDayjs.value
        : eventStartDayjs

      const endTime = eventEndDayjs.isAfter(chartEndDayjs.value)
        ? chartEndDayjs.value
        : eventEndDayjs

      const startMinutes = startTime.diff(chartStartDayjs.value, "minutes")
      const endMinutes = endTime.diff(chartStartDayjs.value, "minutes")

      const startPosition = (startMinutes / totalMinutes) * ganttWidth.value
      const endPosition = (endMinutes / totalMinutes) * ganttWidth.value
      const width = Math.max(endPosition - startPosition, 2)

      return {
        ...event,
        width: `${width}px`,
        xPosition: startPosition
      }
    })

    processedTimeaxisEvents.value = processedEvents

    setEventsInCache(eventsCacheKey, processedEvents)
  }

  watch(
    () => configPrecision.value,
    () => {
      internalPrecision.value = configPrecision.value
      zoomLevel.value = defaultZoom.value
    }
  )

  watch([() => holidayHighlight.value, () => locale.value], () => {
    dayjs.locale(locale.value)
    cache.lower.clear()
    cache.upper.clear()
  })

  watch(ganttWidth, () => {
    updateEventPositions()
  })

  watch(
    [() => timeaxisEvents.value, () => config.chartStart.value, () => config.chartEnd.value],
    () => {
      updateEventPositions()
    },
    { deep: true }
  )

  /**
   * Main computed property for time axis units
   * Implements caching and optimized calculations
   */
  const timeaxisUnits = computed(() => {
    const { chartStartDayjs, chartEndDayjs } = useDayjsHelper(config)

    const lowerCacheKey = getCacheKey(
      chartStartDayjs.value,
      chartEndDayjs.value,
      internalPrecision.value,
      zoomLevel.value
    )

    let lowerUnits = getFromCache(cache.lower, lowerCacheKey)
    const lowerUnitsByStartTime = new Map<number, TimeaxisUnit>()

    if (!lowerUnits) {
      lowerUnits = []
      let currentLower = chartStartDayjs.value.clone()

      while (currentLower.isBefore(chartEndDayjs.value)) {
        const unit = createTimeaxisUnit(
          currentLower,
          getDisplayFormat(internalPrecision.value),
          `${unitWidth.value}px`
        )
        lowerUnits.push(unit)
        lowerUnitsByStartTime.set(currentLower.valueOf(), unit)
        currentLower = currentLower.add(1, getDayjsUnit(internalPrecision.value))
      }

      setInCache(cache.lower, lowerCacheKey, lowerUnits)
    }

    const upperCacheKey = getCacheKey(
      chartStartDayjs.value,
      chartEndDayjs.value,
      upperPrecision.value as TimeUnit,
      zoomLevel.value
    )

    let upperUnits = getFromCache(cache.upper, upperCacheKey)

    if (!upperUnits) {
      upperUnits = []

      let currentUpper = chartStartDayjs.value.startOf(getDayjsUnit(upperPrecision.value))

      while (currentUpper.isBefore(chartEndDayjs.value)) {
        const nextUpper = currentUpper.add(1, getDayjsUnit(upperPrecision.value))

        const effectiveStart = currentUpper.isBefore(chartStartDayjs.value)
          ? chartStartDayjs.value
          : currentUpper

        const effectiveEnd = nextUpper.isAfter(chartEndDayjs.value)
          ? chartEndDayjs.value
          : nextUpper

        let unitsInPeriod = 0

        if (internalPrecision.value === "day") {
          unitsInPeriod = Math.ceil(effectiveEnd.diff(effectiveStart, "day", true))
        } else if (internalPrecision.value === "month") {
          unitsInPeriod = Math.ceil(effectiveEnd.diff(effectiveStart, "month", true))
        } else if (internalPrecision.value === "week") {
          unitsInPeriod = Math.ceil(effectiveEnd.diff(effectiveStart, "week", true))
        } else {
          unitsInPeriod = Math.ceil(effectiveEnd.diff(effectiveStart, "hour", true))
        }

        const totalWidth = unitsInPeriod * unitWidth.value

        if (totalWidth > 0) {
          upperUnits.push(
            createTimeaxisUnit(
              currentUpper,
              getDisplayFormat(upperPrecision.value),
              `${totalWidth}px`
            )
          )
        }

        currentUpper = nextUpper
      }

      setInCache(cache.upper, upperCacheKey, upperUnits)
    }

    if (timeaxisEvents.value?.length && processedTimeaxisEvents.value.length === 0) {
      updateEventPositions()
    }

    const minuteSteps = calculateMinuteSteps()

    cleanExpiredCache()

    return {
      result: {
        upperUnits,
        lowerUnits,
        events: processedTimeaxisEvents.value
      },
      globalMinuteStep: minuteSteps
    }
  })

  /**
   * Calculates minute steps based on current settings
   */
  const calculateMinuteSteps = () => {
    if (!config.enableMinutes.value || internalPrecision.value !== "hour") {
      return []
    }

    const cellWidth = unitWidth.value
    const minCellWidth = 16
    const possibleDivisions = Math.floor(cellWidth / minCellWidth)

    let step: number
    if (possibleDivisions >= 60) step = 1
    else if (possibleDivisions >= 12) step = 5
    else if (possibleDivisions >= 6) step = 10
    else if (possibleDivisions >= 4) step = 15
    else if (possibleDivisions >= 2) step = 30
    else return ["00"]

    return Array.from({ length: 60 / step }, (_, i) => (i * step).toString().padStart(2, "0"))
  }

  /**
   * Removes expired entries from cache
   */
  const cleanExpiredCache = () => {
    const now = Date.now()
    for (const [key, entry] of cache.lower.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.lower.delete(key)
      }
    }
    for (const [key, entry] of cache.upper.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.upper.delete(key)
      }
    }
    for (const [key, entry] of cache.events.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.events.delete(key)
      }
    }
  }

  /**
   * Handles zoom level adjustments
   */
  const adjustZoomAndPrecision = (increase: boolean) => {
    if (increase) {
      if (zoomLevel.value === MAX_ZOOM) {
        const previousPrecision = getPreviousPrecision(internalPrecision.value)
        if (previousPrecision !== internalPrecision.value) {
          internalPrecision.value = previousPrecision
          zoomLevel.value = MIN_ZOOM
        }
      } else {
        zoomLevel.value += 1
      }
    } else {
      if (zoomLevel.value === MIN_ZOOM) {
        const nextPrecision = getNextPrecision(internalPrecision.value)
        if (nextPrecision !== internalPrecision.value) {
          internalPrecision.value = nextPrecision
          zoomLevel.value = MAX_ZOOM
        }
      } else {
        zoomLevel.value -= 1
      }
    }
  }

  watch(
    [
      () => config.chartStart.value,
      () => config.chartEnd.value,
      internalPrecision,
      zoomLevel,
      () => config.timeaxisEvents.value
    ],
    () => {
      cache.lower.clear()
      cache.upper.clear()
      cache.events.clear()
      updateEventPositions()
    }
  )
  updateEventPositions()

  return {
    timeaxisUnits,
    internalPrecision,
    zoomLevel,
    adjustZoomAndPrecision
  }
}
