import { type GanttBarObject } from "../types/bar"
import type { GGanttChartConfig } from "../types/config"
import dayjs from "dayjs"
import type { UseRowsReturn } from "./useRows"

export interface MovementResult {
  success: boolean
  affectedBars: Set<GanttBarObject>
}

export interface MovementAPI {
  moveBar: (bar: GanttBarObject, newStart: string, newEnd: string) => MovementResult
  findOverlappingBars: (bar: GanttBarObject) => GanttBarObject[]
  findConnectedBars: (bar: GanttBarObject) => GanttBarObject[]
}

interface DayjsHelper {
  toDayjs: (input: string | Date | GanttBarObject, startOrEnd?: "start" | "end") => dayjs.Dayjs
  format: (input: string | Date | dayjs.Dayjs, pattern?: string | false) => string | Date
}

export function useBarMovement(
  config: GGanttChartConfig,
  rowManager: UseRowsReturn,
  dayjsHelper: DayjsHelper
) {
  const { barStart, barEnd, dateFormat, pushOnOverlap, pushOnConnect } = config
  const processedBars = new Set<string>()

  const formatDate = (date: dayjs.Dayjs): string => {
    const result = dayjsHelper.format(date, dateFormat.value)
    return typeof result === "string" ? result : result.toISOString()
  }

  const checkMilestoneConstraint = (bar: GanttBarObject, newEnd: string): boolean => {
    if (!bar.ganttBarConfig.milestoneName || !config.milestones.value) return true

    const milestone = config.milestones.value.find(
      (m) => m.name === bar.ganttBarConfig.milestoneName
    )
    if (!milestone) return true
    const endDate = dayjsHelper.toDayjs(newEnd)
    const date = dayjs(milestone.date)
    let milestoneDate = date
    if (!date.hour() && !date.minute()) {
      milestoneDate = dayjsHelper.toDayjs(date.hour(23).minute(59).format("YYYY-MM-DD HH:mm"))
    }

    return endDate.isSameOrBefore(milestoneDate)
  }

  const moveBar = (
    bar: GanttBarObject,
    newStart: string,
    newEnd: string,
    initialMove = true
  ): MovementResult => {
    if (processedBars.has(bar.ganttBarConfig.id)) {
      return { success: true, affectedBars: new Set() }
    }

    if (!checkMilestoneConstraint(bar, newEnd)) {
      return { success: false, affectedBars: new Set() }
    }

    processedBars.add(bar.ganttBarConfig.id)
    const affectedBars = new Set<GanttBarObject>()

    const originalStart = bar[barStart.value]
    const originalEnd = bar[barEnd.value]

    bar[barStart.value] = newStart
    bar[barEnd.value] = newEnd

    const result = handleBarInteractions(bar, affectedBars)

    if (!result.success) {
      bar[barStart.value] = originalStart
      bar[barEnd.value] = originalEnd
      processedBars.delete(bar.ganttBarConfig.id)
      return { success: false, affectedBars: new Set() }
    }

    if (initialMove) {
      processedBars.clear()
    }

    return { success: true, affectedBars }
  }

  const handleBarInteractions = (
    bar: GanttBarObject,
    affectedBars: Set<GanttBarObject>
  ): { success: boolean } => {
    const overlappingBars = pushOnOverlap.value ? findOverlappingBars(bar) : []
    const connectedBars = pushOnConnect.value ? findConnectedBars(bar) : []

    const impactedBars = [...new Set([...overlappingBars, ...connectedBars])]

    for (const impactedBar of impactedBars) {
      if (impactedBar.ganttBarConfig.immobile) {
        return { success: false }
      }

      const { shouldMove, minutesToMove, direction } = calculateMovement(bar, impactedBar)
      if (!shouldMove) continue

      const newStart = formatDate(
        direction === "left"
          ? dayjsHelper.toDayjs(impactedBar[barStart.value]).subtract(minutesToMove, "minutes")
          : dayjsHelper.toDayjs(impactedBar[barStart.value]).add(minutesToMove, "minutes")
      )

      const newEnd = formatDate(
        direction === "left"
          ? dayjsHelper.toDayjs(impactedBar[barEnd.value]).subtract(minutesToMove, "minutes")
          : dayjsHelper.toDayjs(impactedBar[barEnd.value]).add(minutesToMove, "minutes")
      )

      if (!checkMilestoneConstraint(impactedBar, newEnd)) {
        return { success: false }
      }

      const result = moveBar(impactedBar, newStart, newEnd, false)
      if (!result.success) {
        return { success: false }
      }

      affectedBars.add(impactedBar)
      result.affectedBars.forEach((b) => affectedBars.add(b))
    }

    return { success: true }
  }

  const calculateMovement = (sourceBar: GanttBarObject, targetBar: GanttBarObject) => {
    const sourceStart = dayjsHelper.toDayjs(sourceBar[barStart.value])
    const sourceEnd = dayjsHelper.toDayjs(sourceBar[barEnd.value])
    const targetStart = dayjsHelper.toDayjs(targetBar[barStart.value])
    const targetEnd = dayjsHelper.toDayjs(targetBar[barEnd.value])

    if (
      targetBar.ganttBarConfig.immobile &&
      ((sourceStart.isBefore(targetEnd) && sourceEnd.isAfter(targetStart)) ||
        (sourceEnd.isAfter(targetStart) && sourceStart.isBefore(targetEnd)))
    ) {
      return { shouldMove: false, minutesToMove: 0, direction: "right" as const }
    }

    if (sourceEnd.isSameOrBefore(targetStart) || sourceStart.isSameOrAfter(targetEnd)) {
      return { shouldMove: false, minutesToMove: 0, direction: "right" as const }
    }

    const direction = sourceStart.isBefore(targetStart) ? ("right" as const) : ("left" as const)
    let minutesToMove = 0

    if (direction === "right") {
      minutesToMove = sourceEnd.diff(targetStart, "minutes", true)
    } else {
      minutesToMove = targetEnd.diff(sourceStart, "minutes", true)
    }

    return {
      shouldMove: true,
      minutesToMove: Math.abs(minutesToMove),
      direction
    }
  }

  const findOverlappingBars = (bar: GanttBarObject): GanttBarObject[] => {
    const currentRow = rowManager.rows.value.find((row) => row.bars.includes(bar))
    if (!currentRow) return []

    return currentRow.bars.filter((otherBar) => {
      if (otherBar === bar || otherBar.ganttBarConfig.pushOnOverlap === false) return false

      const start1 = dayjsHelper.toDayjs(bar[barStart.value])
      const end1 = dayjsHelper.toDayjs(bar[barEnd.value])
      const start2 = dayjsHelper.toDayjs(otherBar[barStart.value])
      const end2 = dayjsHelper.toDayjs(otherBar[barEnd.value])

      return (
        (start1.isBefore(end2) && end1.isAfter(start2)) ||
        (start2.isBefore(end1) && end2.isAfter(start1))
      )
    })
  }

  const findConnectedBars = (bar: GanttBarObject): GanttBarObject[] => {
    const allBars = rowManager.rows.value.flatMap((row) => row.bars)
    const connectedBars: GanttBarObject[] = []

    bar.ganttBarConfig.connections?.forEach((conn) => {
      const targetBar = allBars.find((b) => b.ganttBarConfig.id === conn.targetId)
      if (targetBar && targetBar.ganttBarConfig.pushOnConnect !== false) {
        connectedBars.push(targetBar)
      }
    })

    allBars.forEach((otherBar) => {
      otherBar.ganttBarConfig.connections?.forEach((conn) => {
        if (
          conn.targetId === bar.ganttBarConfig.id &&
          otherBar.ganttBarConfig.pushOnConnect !== false
        ) {
          connectedBars.push(otherBar)
        }
      })
    })

    return connectedBars
  }

  return {
    moveBar,
    findOverlappingBars,
    findConnectedBars
  }
}
