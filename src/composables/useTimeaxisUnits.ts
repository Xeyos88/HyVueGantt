import { computed, ref, watch, type Ref } from "vue"
import type { Dayjs, ManipulateType, UnitType } from "dayjs"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import type { TimeaxisResult, TimeaxisUnit, TimeUnit } from "../types"
import { useElementSize } from "@vueuse/core"
import { useHolidays } from "./useHolidays"

type ExtendedTimeUnit = TimeUnit | "year" | "isoWeek"
type DayjsUnitType = ManipulateType

type DisplayFormat = {
  [key in TimeUnit | "year"]: string
}

type PrecisionMapType = {
  [key in TimeUnit]: ExtendedTimeUnit
}

const MIN_UNIT_WIDTH_PX = 24

export default function useTimeaxisUnits(timeaxisRef: Ref<HTMLElement | null>) {
  const config = provideConfig()
  const { precision: configPrecision, widthNumber } = config
  const { enableMinutes } = provideBooleanConfig()
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()
  const { width: containerWidth } = useElementSize(timeaxisRef)
  const { getHolidayInfo } = useHolidays(config)

  const internalPrecision = ref<TimeUnit>(configPrecision.value)

  const displayFormats: DisplayFormat = {
    hour: "HH",
    date: "DD.MMM",
    day: "DD.MMM",
    week: "WW",
    month: "MMMM YYYY",
    year: "YYYY"
  }

  const precisionHierarchy: TimeUnit[] = ["hour", "day", "week", "month"]

  const getNextPrecision = (currentPrecision: TimeUnit): TimeUnit => {
    const currentIndex = precisionHierarchy.indexOf(currentPrecision)
    if (currentIndex < precisionHierarchy.length - 1) {
      return precisionHierarchy[currentIndex + 1]!
    }
    return currentPrecision
  }

  const getPreviousPrecision = (currentPrecision: TimeUnit): TimeUnit => {
    const currentIndex = precisionHierarchy.indexOf(currentPrecision)
    if (currentIndex > 0) {
      return precisionHierarchy[currentIndex - 1]!
    }
    return currentPrecision
  }

  const calculateUnitWidth = (totalUnits: number): number => {
    if (!containerWidth.value) return 0
    return containerWidth.value / totalUnits
  }

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

  watch(
    [containerWidth, widthNumber, () => configPrecision.value],
    () => {
      if (containerWidth.value > 0) {
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

  const getDisplayFormat = (unit: ExtendedTimeUnit): string => {
    if (unit === "isoWeek") return displayFormats.week
    return displayFormats[unit as keyof DisplayFormat] || displayFormats.day
  }

  const calculateWidth = (start: Dayjs, end: Dayjs, total: number): string => {
    const width = (end.diff(start, "minutes", true) / total) * 100
    return `${width}%`
  }

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

  const calculateCellWidth = (percentageWidth: string): number => {
    if (!timeaxisRef.value) {
      return 0
    }

    const containerWidth = timeaxisRef.value.offsetWidth
    const numericWidth = parseFloat(percentageWidth)
    const cellWidth = (containerWidth * numericWidth) / 100

    return cellWidth
  }

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

  const createTimeaxisUnit = (moment: Dayjs, format: string, width: string): TimeaxisUnit => {
    const date = moment.toDate()
    const holidayInfo = config.holidayHighlight.value ? getHolidayInfo(date) : null

    return {
      label: moment.format(format),
      value: String(moment),
      date,
      width,
      isHoliday: holidayInfo?.isHoliday || false,
      holidayName: holidayInfo?.holidayName,
      holidayType: holidayInfo?.holidayType
    }
  }

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
