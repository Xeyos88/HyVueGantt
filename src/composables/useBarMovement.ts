import { type GanttBarObject } from "../types/bar"
import type { GGanttChartConfig } from "../types/config"
import dayjs from "dayjs"
import type { UseRowsReturn } from "./useRows"

/**
 * Interface defining the result of a bar movement operation
 */
export interface MovementResult {
  success: boolean
  affectedBars: Set<GanttBarObject>
}

/**
 * Interface defining the API for bar movement operations
 */
export interface MovementAPI {
  moveBar: (bar: GanttBarObject, newStart: string, newEnd: string) => MovementResult
  findOverlappingBars: (bar: GanttBarObject) => GanttBarObject[]
  findConnectedBars: (bar: GanttBarObject) => GanttBarObject[]
  getAllBars: () => GanttBarObject[]
}

/**
 * Interface defining the dayjs helper functions required for bar movement
 */
interface DayjsHelper {
  toDayjs: (input: string | Date | GanttBarObject, startOrEnd?: "start" | "end") => dayjs.Dayjs
  format: (input: string | Date | dayjs.Dayjs, pattern?: string | false) => string | Date
}

/**
 * A composable that manages bar movement operations in the Gantt chart
 * Handles validation, collision detection, and connected bar movement
 * @param config - Gantt chart configuration
 * @param rowManager - Row management utilities
 * @param dayjsHelper - Date manipulation utilities
 * @returns MovementAPI object for managing bar movements
 */
export function useBarMovement(
  config: GGanttChartConfig,
  rowManager: UseRowsReturn,
  dayjsHelper: DayjsHelper
) {
  const { barStart, barEnd, dateFormat, pushOnOverlap, pushOnConnect } = config
  const processedBars = new Set<string>()

  /**
   * Formats a dayjs date according to chart configuration
   * @param date - Date to format
   * @returns Formatted date string
   */
  const formatDate = (date: dayjs.Dayjs): string => {
    const result = dayjsHelper.format(date, dateFormat.value)
    return typeof result === "string" ? result : result.toISOString()
  }

  /**
   * Validates if a bar movement respects milestone constraints
   * @param bar - Bar being moved
   * @param newEnd - Proposed new end date
   * @returns Boolean indicating if movement is allowed
   */
  const checkMilestoneConstraint = (bar: GanttBarObject, newEnd: string): boolean => {
    if (!bar.ganttBarConfig.milestoneId || !config.milestones.value) return true

    const milestone = config.milestones.value.find((m) => m.id === bar.ganttBarConfig.milestoneId)
    if (!milestone) return true
    const endDate = dayjsHelper.toDayjs(newEnd)
    const date = dayjs(milestone.date)
    let milestoneDate = date
    if (!date.hour() && !date.minute()) {
      milestoneDate = dayjsHelper.toDayjs(date.hour(23).minute(59).format("YYYY-MM-DD HH:mm"))
    }

    return endDate.isSameOrBefore(milestoneDate)
  }

  /**
   * Gets all bars from all rows including nested groups
   * @returns Array of all bars in the chart
   */
  const getAllBars = (): GanttBarObject[] => {
    const extractBarsFromRow = (row: any): GanttBarObject[] => {
      let bars: GanttBarObject[] = [...row.bars]
      if (row.children?.length) {
        row.children.forEach((child: any) => {
          bars = [...bars, ...extractBarsFromRow(child)]
        })
      }
      return bars
    }

    return rowManager.rows.value.flatMap((row) => extractBarsFromRow(row))
  }

  /**
   * Moves a bar to new start and end positions
   * Handles validation and affected bar movement
   * @param bar - Bar to move
   * @param newStart - New start date
   * @param newEnd - New end date
   * @param initialMove - Whether this is the initial movement
   * @returns MovementResult indicating success and affected bars
   */
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

    if (bar.ganttBarConfig.bundle && initialMove) {
      const bundleBars = getAllBars().filter(
        (b) => b.ganttBarConfig.bundle === bar.ganttBarConfig.bundle && b !== bar
      )

      const timeDiff = dayjsHelper
        .toDayjs(newStart)
        .diff(dayjsHelper.toDayjs(originalStart), "minutes")

      for (const bundleBar of bundleBars) {
        const bundleBarNewStart = formatDate(
          dayjsHelper.toDayjs(bundleBar[barStart.value]).add(timeDiff, "minutes")
        )
        const bundleBarNewEnd = formatDate(
          dayjsHelper.toDayjs(bundleBar[barEnd.value]).add(timeDiff, "minutes")
        )

        const bundleResult = moveBar(bundleBar, bundleBarNewStart, bundleBarNewEnd, false)
        if (!bundleResult.success) {
          bar[barStart.value] = originalStart
          bar[barEnd.value] = originalEnd
          processedBars.delete(bar.ganttBarConfig.id)
          return { success: false, affectedBars: new Set() }
        }
        bundleResult.affectedBars.forEach((b) => affectedBars.add(b))
      }
    }

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

    affectedBars.add(bar)
    return { success: true, affectedBars }
  }

  /**
   * Handles interactions between bars during movement
   * Manages overlapping and connected bars
   * @param bar - Bar being moved
   * @param affectedBars - Set of bars affected by movement
   * @returns Object indicating success of interactions
   */
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

  /**
   * Calculates how much a bar needs to move based on interaction with another bar
   * @param sourceBar - Bar initiating movement
   * @param targetBar - Bar being impacted
   * @returns Movement calculation details
   */
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

  /**
   * Finds all bars that overlap with the given bar
   * @param bar - Bar to check for overlaps
   * @returns Array of overlapping bars
   */
  const findOverlappingBars = (bar: GanttBarObject): GanttBarObject[] => {
    const findRowForBar = (searchBar: GanttBarObject, rows: any[]): any | null => {
      for (const row of rows) {
        if (row.bars.includes(searchBar)) return row
        if (row.children?.length) {
          const foundInChildren = findRowForBar(searchBar, row.children)
          if (foundInChildren) return foundInChildren
        }
      }
      return null
    }

    const barRow = findRowForBar(bar, rowManager.rows.value)
    if (!barRow) return []

    return barRow.bars.filter((otherBar: GanttBarObject) => {
      if (otherBar === bar || otherBar.ganttBarConfig.pushOnOverlap === false) return false
      if (otherBar.ganttBarConfig.id.startsWith("group-")) return false

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

  /**
   * Finds all bars connected to the given bar
   * @param bar - Bar to check for connections
   * @returns Array of connected bars
   */
  const findConnectedBars = (bar: GanttBarObject): GanttBarObject[] => {
    const allBars = getAllBars()
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
    findConnectedBars,
    getAllBars
  }
}
