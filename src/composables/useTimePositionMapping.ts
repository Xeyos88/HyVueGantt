// useTimePositionMapping.ts

import type { GGanttChartConfig, TimeUnit } from "../types"
import { computed, ref, watch } from "vue"
import useDayjsHelper from "./useDayjsHelper"
import provideConfig from "../provider/provideConfig"
import useTimeaxisUnits from "./useTimeaxisUnits"
import type { ManipulateType } from "dayjs"
import { ganttWidth } from "./useSimpleStore"
import provideBooleanConfig from "../provider/provideBooleanConfig"

export default function useTimePositionMapping(
  config: GGanttChartConfig = provideConfig(),
  booleanConfig = provideBooleanConfig()
) {
  const { dateFormat } = config
  const { chartEndDayjs, toDayjs, format } = useDayjsHelper(config)

  // Otteniamo la reference al timeaxis per calcolare le dimensioni delle unità
  const { timeaxisUnits } = useTimeaxisUnits(ref(null), config, booleanConfig.enableMinutes)

  const getPrecisionAsManipulateType = (precision: TimeUnit): ManipulateType => {
    const precisionMap: Record<TimeUnit, ManipulateType> = {
      hour: "hour",
      day: "day",
      date: "day",
      week: "week",
      month: "month"
    }
    return precisionMap[precision]
  }
  // Calcoliamo la larghezza totale del chart in pixel
  const totalWidth = computed(() => {
    const lowerUnits = timeaxisUnits.value.result.lowerUnits
    return lowerUnits.reduce((total, unit) => {
      return total + parseInt(unit.width!)
    }, 0)
  })

  watch(
    () => totalWidth.value,
    () => {
      ganttWidth.value = totalWidth.value
    },
    { immediate: true }
  )

  const mapTimeToPosition = (time: string) => {
    const timePoint = toDayjs(time)
    const lowerUnits = timeaxisUnits.value.result.lowerUnits
    let position = 0

    // Troviamo tutte le unità prima del nostro punto temporale
    for (const unit of lowerUnits) {
      const unitTime = toDayjs(unit.date)
      if (unitTime.isAfter(timePoint)) {
        break
      }
      position += parseInt(unit.width!)
    }

    // Calcoliamo la posizione precisa all'interno dell'unità corrente
    const currentUnit = lowerUnits.find((unit) => {
      const unitTime = toDayjs(unit.date)
      const nextUnitTime = unitTime.add(1, getPrecisionAsManipulateType(config.precision.value))
      return timePoint.isBetween(unitTime, nextUnitTime, null, "[)")
    })

    if (currentUnit) {
      const unitStart = toDayjs(currentUnit.date)
      const unitWidth = parseInt(currentUnit.width!)
      const percentage =
        timePoint.diff(unitStart) /
        unitStart.add(1, getPrecisionAsManipulateType(config.precision.value)).diff(unitStart)
      position += unitWidth * percentage
    }

    return Math.round(position)
  }

  const mapPositionToTime = (xPos: number) => {
    const lowerUnits = timeaxisUnits.value.result.lowerUnits
    let accumulatedWidth = 0
    let targetUnit = lowerUnits[0]

    // Troviamo l'unità corrispondente alla posizione
    for (const unit of lowerUnits) {
      const unitWidth = parseInt(unit.width!)
      if (accumulatedWidth + unitWidth > xPos) {
        targetUnit = unit
        break
      }
      accumulatedWidth += unitWidth
    }

    if (!targetUnit) {
      return format(chartEndDayjs.value, dateFormat.value)
    }

    // Calcoliamo il momento preciso all'interno dell'unità
    const unitStart = toDayjs(targetUnit.date)
    const unitWidth = parseInt(targetUnit.width!)
    const positionInUnit = xPos - accumulatedWidth
    const percentage = positionInUnit / unitWidth

    // Importante: calcoliamo il tempo esatto all'interno dell'unità
    const timeInUnit = unitStart
      .add(1, getPrecisionAsManipulateType(config.precision.value))
      .diff(unitStart)
    const timeOffset = timeInUnit * percentage

    // Restituiamo il timestamp corretto
    return format(unitStart.add(Math.floor(timeOffset), "millisecond"), dateFormat.value)
  }

  return {
    mapTimeToPosition,
    mapPositionToTime,
    totalWidth
  }
}
