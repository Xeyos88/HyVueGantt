import { computed, ref, watch, type Ref } from "vue"
import type { Dayjs, ManipulateType } from "dayjs"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import type { GGanttChartConfig, TimeaxisUnit, TimeUnit } from "../types"
import { useElementSize } from "@vueuse/core"
import { useHolidays } from "./useHolidays"
import { ganttWidth } from "./useSimpleStore"

const BASE_UNIT_WIDTH = 24
const MAX_ZOOM = 10
const MIN_ZOOM = 1
const DEFAULT_ZOOM = 5

type ExtendedTimeUnit = TimeUnit | "year" | "isoWeek"

type DisplayFormat = {
  [key in TimeUnit | "year"]: string
}

type PrecisionMapType = {
  [key in TimeUnit]: ExtendedTimeUnit
}

export const capitalizeString = (str: string): string => {
  if (!str) return str
  return str.normalize("NFD").replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase())
}

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

const zoomLevel = ref(DEFAULT_ZOOM)

export default function useTimeaxisUnits(
  timeaxisRef: Ref<HTMLElement | null>,
  config: GGanttChartConfig = provideConfig(),
  enableMinutes = provideBooleanConfig().enableMinutes
) {
  const { getHolidayInfo } = useHolidays(config)

  const { precision: configPrecision, holidayHighlight } = config

  const { chartStartDayjs, chartEndDayjs, toDayjs } = useDayjsHelper(config)
  const { width: containerWidth } = useElementSize(timeaxisRef)

  const internalPrecision = ref<TimeUnit>(configPrecision.value)

  // Display format per ogni tipo di unità temporale
  const displayFormats: DisplayFormat = {
    hour: "HH",
    date: "DD.MMM",
    day: "DD.MMM",
    week: "WW",
    month: "MMMM YYYY",
    year: "YYYY"
  }

  // Gerarchia delle precisioni dal più fine al più grossolano
  const precisionHierarchy: TimeUnit[] = ["hour", "day", "week", "month"]

  const unitWidth = computed(() => BASE_UNIT_WIDTH * zoomLevel.value)

  /*const getNextPrecision = (currentPrecision: TimeUnit): TimeUnit => {
    const currentIndex = precisionHierarchy.indexOf(currentPrecision)
    if (currentIndex < precisionHierarchy.length - 1) {
      return precisionHierarchy[currentIndex + 1]!
    }
    return currentPrecision
  }*/

  /*const getPreviousPrecision = (currentPrecision: TimeUnit): TimeUnit => {
    const currentIndex = precisionHierarchy.indexOf(currentPrecision)
    const configIndex = precisionHierarchy.indexOf(configPrecision.value)
    if (currentIndex > 0 && currentIndex > configIndex) {
      return precisionHierarchy[currentIndex - 1]!
    }
    return currentPrecision
  }*/

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

  const calculateMinuteSteps = () => {
    if (!enableMinutes || internalPrecision.value !== "hour") {
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
   * Gets display format for a time unit
   * @param unit - Time unit
   * @returns Format string
   */
  const getDisplayFormat = (unit: ExtendedTimeUnit): string => {
    if (unit === "isoWeek") return displayFormats.week
    return displayFormats[unit as keyof DisplayFormat] || displayFormats.day
  }

  const timeaxisUnits = computed(() => {
    // Calcolo delle lower units
    const lowerUnits: TimeaxisUnit[] = []
    let currentLower = chartStartDayjs.value.clone()

    while (currentLower.isBefore(chartEndDayjs.value)) {
      lowerUnits.push(
        createTimeaxisUnit(
          currentLower,
          getDisplayFormat(internalPrecision.value),
          `${unitWidth.value}px`
        )
      )
      currentLower = currentLower.add(1, getDayjsUnit(internalPrecision.value))
    }

    // Calcolo delle upper units
    const upperUnits: TimeaxisUnit[] = []
    let currentUpper = chartStartDayjs.value.clone().startOf(getDayjsUnit(upperPrecision.value))

    while (currentUpper.isBefore(chartEndDayjs.value)) {
      const nextUpper = currentUpper.add(1, getDayjsUnit(upperPrecision.value))
      const unitsInPeriod = lowerUnits.filter((unit) => {
        const unitDate = toDayjs(unit.date)
        return unitDate.isSameOrAfter(currentUpper) && unitDate.isBefore(nextUpper)
      })

      const totalWidth = unitsInPeriod.length * unitWidth.value

      upperUnits.push(
        createTimeaxisUnit(currentUpper, getDisplayFormat(upperPrecision.value), `${totalWidth}px`)
      )

      currentUpper = nextUpper
    }

    return {
      result: {
        upperUnits,
        lowerUnits
      },
      globalMinuteStep: calculateMinuteSteps()
    }
  })

  const adjustZoomAndPrecision = (increase: boolean) => {
    const currentIndex = precisionHierarchy.indexOf(internalPrecision.value)
    const configIndex = precisionHierarchy.indexOf(configPrecision.value)

    if (increase) {
      if (zoomLevel.value === MAX_ZOOM) {
        if (currentIndex > configIndex) {
          const prevPrecision = precisionHierarchy[currentIndex - 1]
          if (prevPrecision) {
            internalPrecision.value = prevPrecision
            zoomLevel.value = MIN_ZOOM
          }
        }
      } else {
        zoomLevel.value += 1
      }
    } else {
      if (zoomLevel.value === MIN_ZOOM) {
        if (currentIndex < precisionHierarchy.length - 1) {
          const nextPrecision = precisionHierarchy[currentIndex + 1]
          if (nextPrecision) {
            internalPrecision.value = nextPrecision
            zoomLevel.value = MAX_ZOOM
          }
        }
      } else {
        zoomLevel.value -= 1
      }
    }
  }
  // Watch per aggiornare la precisione interna quando cambia la dimensione del container
  watch(
    [containerWidth, () => configPrecision.value, () => ganttWidth.value],
    () => {
      console.log(ganttWidth.value)
      if (containerWidth.value > 0) {
        const currentIndex = precisionHierarchy.indexOf(internalPrecision.value)
        const configIndex = precisionHierarchy.indexOf(configPrecision.value)
        console.log(currentIndex, configIndex)
        if (currentIndex <= configIndex) {
          internalPrecision.value = configPrecision.value
        }
      }
    },
    { immediate: true }
  )

  return {
    timeaxisUnits,
    internalPrecision,
    zoomLevel,
    adjustZoomAndPrecision
  }
}
