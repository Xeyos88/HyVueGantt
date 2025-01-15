import type { GanttBarObject } from "../types"
import useDayjsHelper from "./useDayjsHelper"
import type { GGanttChartConfig } from "../types/config"
import { useBarMovement } from "./useBarMovement"
import { inject } from "vue"
import type { UseRowsReturn } from "./useRows"

/**
 * Manages keyboard controls for Gantt chart bars
 * Handles arrow key navigation for moving and resizing bars
 * @param bar - Bar to control with keyboard
 * @param config - Gantt chart configuration
 * @param emitBarEvent - Function to emit bar events
 * @returns Object containing keyboard event handler
 */
export function useBarKeyboardControl(
  bar: GanttBarObject,
  config: GGanttChartConfig,
  emitBarEvent: (e: MouseEvent, bar: GanttBarObject, datetime?: string | Date) => void
) {
  const dayjs = useDayjsHelper(config)
  const { barStart, barEnd, dateFormat, precision } = config
  const rowManager = inject<UseRowsReturn>("useRows")!

  const movement = useBarMovement(config, rowManager, dayjs)

  /**
   * Time step configurations for different precision levels
   * Defines how many minutes to move for each precision unit
   */
  const TIME_STEP = {
    hour: 5,
    day: 120,
    week: 840,
    month: 3600
  }

  /**
   * Calculates the time step based on precision and shift key state
   * @param isShiftPressed - Whether shift key is pressed
   * @returns Number of minutes to move
   */
  const getTimeStep = (isShiftPressed: boolean): number => {
    const baseStep = TIME_STEP[precision.value as keyof typeof TIME_STEP] || TIME_STEP.hour
    return isShiftPressed ? baseStep * 12 : baseStep
  }

  /**
   * Moves bar position forward or backward
   * @param direction - Direction to move ('forward' or 'backward')
   * @param isShiftPressed - Whether shift key is pressed
   */
  const moveBarPosition = (direction: "forward" | "backward", isShiftPressed: boolean) => {
    const multiplier = direction === "forward" ? 1 : -1
    const minutesToMove = getTimeStep(isShiftPressed)

    const currentStart = dayjs.toDayjs(bar[barStart.value])
    const currentEnd = dayjs.toDayjs(bar[barEnd.value])

    const newStart = currentStart.add(minutesToMove * multiplier, "minutes")
    const newEnd = currentEnd.add(minutesToMove * multiplier, "minutes")

    if (newStart.isBefore(config.chartStart.value) || newEnd.isAfter(config.chartEnd.value)) {
      return
    }

    const newStartStr = dayjs.format(newStart, dateFormat.value) as string
    const newEndStr = dayjs.format(newEnd, dateFormat.value) as string

    const result = movement.moveBar(bar, newStartStr, newEndStr)
    if (result.success) {
      emitDragEvents()
    }
  }

  /**
   * Expands or shrinks bar from both ends
   * @param type - Action to perform ('expand' or 'shrink')
   * @param isShiftPressed - Whether shift key is pressed
   */
  const resizeBar = (type: "expand" | "shrink", isShiftPressed: boolean) => {
    const currentStart = dayjs.toDayjs(bar[barStart.value])
    const currentEnd = dayjs.toDayjs(bar[barEnd.value])
    let minutesToMove = getTimeStep(isShiftPressed)

    if (minutesToMove === 5) {
      minutesToMove = 10
    }
    const timePerSide = minutesToMove / 2

    let newStart: string
    let newEnd: string

    if (type === "expand") {
      newStart = dayjs.format(
        currentStart.subtract(timePerSide, "minutes"),
        dateFormat.value
      ) as string
      newEnd = dayjs.format(currentEnd.add(timePerSide, "minutes"), dateFormat.value) as string
    } else {
      const currentDuration = currentEnd.diff(currentStart, "minutes")
      if (currentDuration <= minutesToMove) {
        return
      }
      newStart = dayjs.format(currentStart.add(timePerSide, "minutes"), dateFormat.value) as string
      newEnd = dayjs.format(currentEnd.subtract(timePerSide, "minutes"), dateFormat.value) as string
    }

    const startDayjs = dayjs.toDayjs(newStart)
    const endDayjs = dayjs.toDayjs(newEnd)

    if (startDayjs.isBefore(config.chartStart.value) || endDayjs.isAfter(config.chartEnd.value)) {
      return
    }

    const result = movement.moveBar(bar, newStart, newEnd)
    if (result.success) {
      emitDragEvents()
    }
  }

  /**
   * Emits drag events to simulate mouse drag operations
   * Used to maintain consistency with mouse-based interactions
   */
  const emitDragEvents = () => {
    const mockEvent = new MouseEvent("drag", { bubbles: true })
    emitBarEvent(mockEvent, bar)

    const mockEndEvent = new MouseEvent("dragend", { bubbles: true })
    emitBarEvent(mockEndEvent, bar)
  }

  /**
   * Handles keyboard events for bar control
   * Maps arrow keys to movement and resize actions
   * @param event - Keyboard event
   */
  const onBarKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (!target.id || target.id !== bar.ganttBarConfig.id || bar.ganttBarConfig.immobile) {
      return
    }

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault()
        moveBarPosition("backward", event.shiftKey)
        break
      case "ArrowRight":
        event.preventDefault()
        moveBarPosition("forward", event.shiftKey)
        break
      case "ArrowUp":
        event.preventDefault()
        resizeBar("expand", event.shiftKey)
        break
      case "ArrowDown":
        event.preventDefault()
        resizeBar("shrink", event.shiftKey)
        break
    }
  }

  return {
    onBarKeyDown
  }
}
