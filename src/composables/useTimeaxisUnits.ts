import { computed } from "vue"
import type { Dayjs, ManipulateType, UnitType } from "dayjs"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import type { TimeaxisUnit, TimeUnit } from "../types"

// Modifichiamo il tipo per renderlo condizionale
type TimeAxisUnitGroup = {
  upperUnits: TimeaxisUnit[]
  lowerUnits: TimeaxisUnit[]
  minutesUnits?: TimeaxisUnit[] // Ora è opzionale
}

type ExtendedTimeUnit = TimeUnit | "year" | "isoWeek"
type DayjsUnitType = ManipulateType

type DisplayFormat = {
  [key in TimeUnit | "year"]: string
}

type PrecisionMapType = {
  [key in TimeUnit]: ExtendedTimeUnit
}

export default function useTimeaxisUnits() {
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

  const minutesStep = computed(() => {
    if (widthNumber.value <= 200) return ["0", "30"]
    if (widthNumber.value <= 500) return ["0", "15", "30", "45"]
    if (widthNumber.value <= 700) return ["0", "10", "20", "30", "40", "50"]
    return ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]
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

  const timeaxisUnits = computed(() => {
    const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes", true)

    const result: TimeAxisUnitGroup = {
      upperUnits: [],
      lowerUnits: []
    }

    let currentUpperUnit = chartStartDayjs.value.startOf(getDayjsUnit(upperPrecision.value))
    let currentLowerUnit = chartStartDayjs.value.startOf(getDayjsUnit(lowerPrecision.value))

    while (currentLowerUnit.isSameOrBefore(chartEndDayjs.value)) {
      const endOfCurrentLower = currentLowerUnit.endOf(getDayjsUnit(lowerPrecision.value))
      const isLastItem = endOfCurrentLower.isAfter(chartEndDayjs.value)

      const width = calculateWidth(
        currentLowerUnit,
        isLastItem ? chartEndDayjs.value : endOfCurrentLower,
        totalMinutes
      )

      result.lowerUnits.push(
        createTimeaxisUnit(currentLowerUnit, getDisplayFormat(precision.value), width)
      )

      if (precision.value === "hour" && enableMinutes) {
        if (!result.minutesUnits) {
          result.minutesUnits = []
        }
        minutesStep.value.forEach((minute) => {
          result.minutesUnits!.push({
            label: minute,
            width: `${parseFloat(width) / minutesStep.value.length}%`,
            date: new Date()
          })
        })
      }

      currentLowerUnit = advanceTimeUnit(endOfCurrentLower, lowerPrecision.value)
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
