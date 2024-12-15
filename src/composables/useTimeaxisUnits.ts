import { computed, type Ref } from "vue"
import type { Dayjs, ManipulateType, UnitType } from "dayjs"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import type { TimeaxisUnit, TimeUnit } from "../types"

type TimeAxisUnitGroup = {
  upperUnits: TimeaxisUnit[]
  lowerUnits: TimeaxisUnit[]
  minutesUnits?: TimeaxisUnit[]
}

type ExtendedTimeUnit = TimeUnit | "year" | "isoWeek"
type DayjsUnitType = ManipulateType

type DisplayFormat = {
  [key in TimeUnit | "year"]: string
}

type PrecisionMapType = {
  [key in TimeUnit]: ExtendedTimeUnit
}

export default function useTimeaxisUnits(timeaxisRef: Ref<HTMLElement | null>) {
  const { precision, widthNumber } = provideConfig()
  const { enableMinutes } = provideBooleanConfig()
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()

  const displayFormats: DisplayFormat = {
    hour: "HH",
    date: "DD.MMM",
    day: "DD.MMM",
    week: "WW",
    month: "MMMM YYYY",
    year: "YYYY"
  }

  const upperPrecision = computed(() => {
    const precisionMap: PrecisionMapType = {
      hour: "day",
      day: "month",
      date: "month",
      week: "month",
      month: "year"
    }

    const upperUnit = precisionMap[precision.value]
    if (!upperUnit) {
      throw new Error("Precision must be one of: 'hour', 'day', 'date', 'week', 'month'")
    }

    return upperUnit
  })

  const lowerPrecision = computed(() => {
    const precisionMap: PrecisionMapType = {
      date: "day",
      week: "isoWeek",
      hour: "hour",
      day: "day",
      month: "month"
    }

    return precisionMap[precision.value]
  })

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
    const minCellWidth = 30

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

  const timeaxisUnits = computed(() => {
    const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes", true)

    const result: TimeAxisUnitGroup = {
      upperUnits: [],
      lowerUnits: []
    }

    let currentUpperUnit = chartStartDayjs.value.clone()
    let currentLowerUnit = chartStartDayjs.value.clone()

    let globalMinuteStep: string[] = []
    if (precision.value === "hour" && enableMinutes) {
      const sampleWidth = calculateWidth(
        currentLowerUnit,
        currentLowerUnit.clone().add(1, "hour"),
        totalMinutes
      )
      const cellWidth = calculateCellWidth(sampleWidth)
      globalMinuteStep = widthNumber.value >= 100 ? getMinutesStepFromCellWidth(cellWidth) : ["00"]
    }

    while (currentLowerUnit.isBefore(chartEndDayjs.value)) {
      const nextLowerUnit = advanceTimeUnit(currentLowerUnit, lowerPrecision.value)
      const endOfCurrentLower = nextLowerUnit.isBefore(chartEndDayjs.value)
        ? nextLowerUnit
        : chartEndDayjs.value

      const width = calculateWidth(currentLowerUnit, endOfCurrentLower, totalMinutes)

      result.lowerUnits.push(
        createTimeaxisUnit(currentLowerUnit, getDisplayFormat(precision.value), width)
      )

      if (precision.value === "hour" && enableMinutes) {
        if (!result.minutesUnits) {
          result.minutesUnits = []
        }

        const minuteWidth = `${parseFloat(width) / globalMinuteStep.length}%`

        globalMinuteStep.forEach((minute) => {
          const minuteValue = parseInt(minute)
          const minuteDate = currentLowerUnit.clone().minute(minuteValue)

          if (minuteDate.isBefore(endOfCurrentLower) && minuteDate.isBefore(chartEndDayjs.value)) {
            result.minutesUnits!.push({
              label: minute,
              value: String(minuteDate),
              width: minuteWidth,
              date: minuteDate.toDate()
            })
          }
        })
      }

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

    return result
  })

  const calculateWidth = (start: Dayjs, end: Dayjs, total: number): string => {
    const width = (end.diff(start, "minutes", true) / total) * 100
    return `${width}%`
  }

  const createTimeaxisUnit = (moment: Dayjs, format: string, width: string): TimeaxisUnit => ({
    label: moment.format(format),
    value: String(moment),
    date: moment.toDate(),
    width
  })

  const advanceTimeUnit = (moment: Dayjs, precision: ExtendedTimeUnit): Dayjs => {
    const unit = getDayjsUnit(precision)
    const startOf = precision === "isoWeek" ? "isoWeek" : unit
    return moment.add(1, unit).startOf(startOf as UnitType)
  }

  return {
    timeaxisUnits
  }
}
