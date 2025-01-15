import { computed, ref, watch, type Ref } from "vue"
import type { Dayjs, ManipulateType, UnitType } from "dayjs"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import type { TimeaxisResult, TimeaxisUnit, TimeUnit } from "../types"
import { useElementSize } from "@vueuse/core"
import { useHolidays } from "./useHolidays"

/**
 * Extended time unit type including year and ISO week
 */
type ExtendedTimeUnit = TimeUnit | "year" | "isoWeek"

/**
 * Type alias for dayjs unit type
 */
type DayjsUnitType = ManipulateType

/**
 * Display format configuration for different time units
 */
type DisplayFormat = {
  [key in TimeUnit | "year"]: string
}

/**
 * Mapping of time units to their parent units
 */
type PrecisionMapType = {
  [key in TimeUnit]: ExtendedTimeUnit
}

/**
 * Minimum width in pixels for a time unit element
 */
const MIN_UNIT_WIDTH_PX = 24

/**
 * Capitalizes first letter of a string, handling Unicode characters
 * @param str - String to capitalize
 * @returns Capitalized string
 */
const capitalizeString = (str: string): string => {
  if (!str) return str
  return str.normalize("NFD").replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase())
}

/**
 * Capitalizes first letter of each word in a string
 * @param str - String to process
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
 * A composable that manages time axis units generation and display
 * @param timeaxisRef - Reference to timeaxis DOM element
 * @returns Object containing timeaxis units and precision state
 */
export default function useTimeaxisUnits(timeaxisRef: Ref<HTMLElement | null>) {
  const config = provideConfig()
  const { precision: configPrecision, widthNumber } = config
  const { enableMinutes } = provideBooleanConfig()
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()
  const { width: containerWidth } = useElementSize(timeaxisRef)
  const { getHolidayInfo } = useHolidays(config)

  const internalPrecision = ref<TimeUnit>(configPrecision.value)

  /**
   * Display format configuration for each time unit
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
   * Hierarchy of precision levels from finest to coarsest
   */
  const precisionHierarchy: TimeUnit[] = ["hour", "day", "week", "month"]

  /**
   * Gets the next coarser precision level
   * @param currentPrecision - Current precision level
   * @returns Next coarser precision level
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
   * @param currentPrecision - Current precision level
   * @returns Next finer precision level
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
   * Calculates the width of a time unit based on total available width
   * @param totalUnits - Total number of units
   * @returns Width of each unit in pixels
   */
  const calculateUnitWidth = (totalUnits: number): number => {
    if (!containerWidth.value) return 0
    return containerWidth.value / totalUnits
  }

  /**
   * Counts the number of units for a given precision level
   * @param precision - Precision level to count units for
   * @returns Total number of units
   */
  const getUnitsCountForPrecision = (precision: TimeUnit): number => {
    let current = chartStartDayjs.value.clone()
    let count = 0

    while (current.isBefore(chartEndDayjs.value)) {
      count++
      switch (precision) {
        case "hour":
          current = current.add(1, "hour")
          break
        case "day":
          current = current.add(1, "day")
          break
        case "week":
          current = current.add(1, "week")
          break
        case "month":
          current = current.add(1, "month")
          break
      }
    }

    return count
  }

  /**
   * Finds the optimal precision level based on available space
   * @param desiredPrecision - Desired precision level
   * @returns Optimal precision level
   */
  const findOptimalPrecision = (desiredPrecision: TimeUnit): TimeUnit => {
    let currentPrecision = desiredPrecision
    let unitWidth = calculateUnitWidth(getUnitsCountForPrecision(currentPrecision))

    while (unitWidth > MIN_UNIT_WIDTH_PX * 2 && currentPrecision !== "hour") {
      const previousPrecision = getPreviousPrecision(currentPrecision)
      const previousWidth = calculateUnitWidth(getUnitsCountForPrecision(previousPrecision))

      if (previousWidth < MIN_UNIT_WIDTH_PX || previousPrecision === currentPrecision) break

      currentPrecision = previousPrecision
      unitWidth = previousWidth
    }
    while (unitWidth <= MIN_UNIT_WIDTH_PX && currentPrecision !== "month") {
      const nextPrecision = getNextPrecision(currentPrecision)
      if (nextPrecision === currentPrecision) break

      const nextWidth = calculateUnitWidth(getUnitsCountForPrecision(nextPrecision))

      if (nextWidth >= MIN_UNIT_WIDTH_PX) {
        currentPrecision = nextPrecision
        unitWidth = nextWidth
      } else {
        break
      }
    }
    return currentPrecision
  }

  /**
   * Watches container width changes and updates precision accordingly
   */
  watch(
    [containerWidth, widthNumber, () => configPrecision.value],
    () => {
      if (containerWidth.value > 0) {
        const currentIndex = precisionHierarchy.indexOf(internalPrecision.value)
        const configIndex = precisionHierarchy.indexOf(configPrecision.value)
        if (currentIndex <= configIndex) {
          internalPrecision.value = configPrecision.value
        }

        const startingPrecision = internalPrecision.value
        const optimalPrecision = findOptimalPrecision(startingPrecision)

        if (optimalPrecision !== internalPrecision.value) {
          internalPrecision.value = optimalPrecision
          const event = new CustomEvent("precision-update", {
            detail: optimalPrecision
          })
          window.dispatchEvent(event)
        }
      }
    },
    { immediate: true }
  )

  /**
   * Computes the upper precision level
   */
  const upperPrecision = computed(() => {
    const precisionMap: PrecisionMapType = {
      hour: "day",
      day: "month",
      date: "month",
      week: "month",
      month: "year"
    }

    const upperUnit = precisionMap[internalPrecision.value]
    if (!upperUnit) {
      throw new Error("Precision must be one of: 'hour', 'day', 'date', 'week', 'month'")
    }

    return upperUnit
  })

  /**
   * Gets the lower precision level for a given unit
   * @param precision - Current precision
   * @returns Lower precision unit
   */
  const getLowerPrecision = (precision: TimeUnit): ExtendedTimeUnit => {
    const precisionMap: PrecisionMapType = {
      date: "day",
      week: "isoWeek",
      hour: "hour",
      day: "day",
      month: "month"
    }

    return precisionMap[precision]
  }

  /**
   * Maps extended time units to dayjs unit types
   * @param unit - Extended time unit
   * @returns Dayjs unit type
   */
  const getDayjsUnit = (unit: ExtendedTimeUnit): DayjsUnitType => {
    const unitMap: Record<ExtendedTimeUnit, DayjsUnitType> = {
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
   * Gets display format for a time unit
   * @param unit - Time unit
   * @returns Format string
   */
  const getDisplayFormat = (unit: ExtendedTimeUnit): string => {
    if (unit === "isoWeek") return displayFormats.week
    return displayFormats[unit as keyof DisplayFormat] || displayFormats.day
  }

  /**
   * Calculates width percentage for a time span
   * @param start - Start date
   * @param end - End date
   * @param total - Total minutes in chart
   * @returns Width percentage string
   */
  const calculateWidth = (start: Dayjs, end: Dayjs, total: number): string => {
    const width = (end.diff(start, "minutes", true) / total) * 100
    return `${width}%`
  }

  /**
   * Computes time axis units based on current configuration
   */
  const timeaxisUnits = computed(() => {
    const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes", true)

    const result: TimeaxisResult = {
      upperUnits: [],
      lowerUnits: []
    }

    let currentUpperUnit = chartStartDayjs.value.clone()
    let currentLowerUnit = chartStartDayjs.value.clone()

    const currentPrecision = internalPrecision.value

    let globalMinuteStep: string[] = []
    if (currentPrecision === "hour" && enableMinutes) {
      const sampleWidth = calculateWidth(
        currentLowerUnit,
        currentLowerUnit.clone().add(1, "hour"),
        totalMinutes
      )
      const cellWidth = calculateCellWidth(sampleWidth)
      globalMinuteStep = widthNumber.value >= 100 ? getMinutesStepFromCellWidth(cellWidth) : ["00"]
    }

    while (currentLowerUnit.isBefore(chartEndDayjs.value)) {
      const nextLowerUnit = advanceTimeUnit(currentLowerUnit, getLowerPrecision(currentPrecision))
      const endOfCurrentLower = nextLowerUnit.isBefore(chartEndDayjs.value)
        ? nextLowerUnit
        : chartEndDayjs.value

      const width = calculateWidth(currentLowerUnit, endOfCurrentLower, totalMinutes)
      result.lowerUnits.push(
        createTimeaxisUnit(currentLowerUnit, getDisplayFormat(currentPrecision), width)
      )

      currentLowerUnit = nextLowerUnit
    }

    while (currentUpperUnit.isSameOrBefore(chartEndDayjs.value)) {
      const endOfCurrentUpper = currentUpperUnit.endOf(getDayjsUnit(upperPrecision.value))
      const isLastItem = endOfCurrentUpper.isAfter(chartEndDayjs.value)

      const width = calculateWidth(
        currentUpperUnit,
        isLastItem ? chartEndDayjs.value : endOfCurrentUpper,
        totalMinutes
      )

      result.upperUnits.push(
        createTimeaxisUnit(currentUpperUnit, getDisplayFormat(upperPrecision.value), width)
      )

      currentUpperUnit = advanceTimeUnit(endOfCurrentUpper, upperPrecision.value)
    }

    return { result, globalMinuteStep }
  })

  /**
   * Calculates cell width in pixels from percentage width
   * @param percentageWidth - Width as percentage string
   * @returns Width in pixels
   */
  const calculateCellWidth = (percentageWidth: string): number => {
    if (!timeaxisRef.value) {
      return 0
    }

    const containerWidth = timeaxisRef.value.offsetWidth
    const numericWidth = parseFloat(percentageWidth)
    const cellWidth = (containerWidth * numericWidth) / 100

    return cellWidth
  }

  /**
   * Determines minute step size based on cell width
   * @param cellWidth - Width of cell in pixels
   * @returns Array of minute values
   */
  const getMinutesStepFromCellWidth = (cellWidth: number): string[] => {
    const minCellWidth = 16
    const possibleDivisions = Math.floor(cellWidth / minCellWidth)

    let step: number
    if (possibleDivisions >= 60) step = 1
    else if (possibleDivisions >= 12) step = 5
    else if (possibleDivisions >= 6) step = 10
    else if (possibleDivisions >= 4) step = 15
    else if (possibleDivisions >= 2) step = 30
    else return ["00"]

    const steps: string[] = []
    for (let i = 0; i < 60; i += step) {
      steps.push(i.toString().padStart(2, "0"))
    }

    return steps
  }

  /**
   * Creates a time axis unit object
   * @param moment - Dayjs date object
   * @param format - Display format
   * @param width - Unit width
   * @returns TimeaxisUnit object
   */
  const createTimeaxisUnit = (moment: Dayjs, format: string, width: string): TimeaxisUnit => {
    const date = moment.toDate()
    const holidayInfo = config.holidayHighlight.value ? getHolidayInfo(date) : null
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
   * Advances a time unit by one unit
   * @param moment - Dayjs date object
   * @param precision - Precision level
   * @returns New Dayjs date object
   */
  const advanceTimeUnit = (moment: Dayjs, precision: ExtendedTimeUnit): Dayjs => {
    const unit = getDayjsUnit(precision)
    const startOf = precision === "isoWeek" ? "isoWeek" : unit
    return moment.add(1, unit).startOf(startOf as UnitType)
  }

  return {
    timeaxisUnits,
    internalPrecision
  }
}
