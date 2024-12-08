import type { GanttBarObject } from "../types/bar"
import useDayjsHelper from "./useDayjsHelper"
import type { GGanttChartConfig } from "../types/config"
import type dayjs from "dayjs"

export function useBarKeyboardControl(
  bar: GanttBarObject,
  config: GGanttChartConfig,
  emitBarEvent: (e: MouseEvent, bar: GanttBarObject, datetime?: string | Date) => void
) {
  const { barStart, barEnd, dateFormat } = config
  const { toDayjs, format } = useDayjsHelper(config)

  const TIME_STEP = {
    hour: 5,
    day: 120,
    week: 840,
    month: 3600
  }

  const getTimeStep = (isShiftPressed: boolean): number => {
    const baseStep = TIME_STEP[config.precision.value as keyof typeof TIME_STEP] || TIME_STEP.hour
    return isShiftPressed ? baseStep * 12 : baseStep
  }

  const moveBar = (direction: "forward" | "backward", isShiftPressed: boolean) => {
    const multiplier = direction === "forward" ? 1 : -1
    const minutesToMove = getTimeStep(isShiftPressed)

    const currentStart = toDayjs(bar[barStart.value])
    const currentEnd = toDayjs(bar[barEnd.value])
    const newStart = currentStart.add(minutesToMove * multiplier, "minutes")
    const newEnd = currentEnd.add(minutesToMove * multiplier, "minutes")

    if (newStart.isBefore(config.chartStart.value) || newEnd.isAfter(config.chartEnd.value)) {
      return
    }

    bar[barStart.value] = format(newStart, dateFormat.value)
    bar[barEnd.value] = format(newEnd, dateFormat.value)

    emitDragEvents()
  }

  const resizeBar = (type: "expand" | "shrink", isShiftPressed: boolean) => {
    const currentStart = toDayjs(bar[barStart.value])
    const currentEnd = toDayjs(bar[barEnd.value])
    let minutesToMove = getTimeStep(isShiftPressed)

    if (minutesToMove === 5) {
      minutesToMove = 10
    }
    const timePerSide = minutesToMove / 2

    let newStart: dayjs.Dayjs
    let newEnd: dayjs.Dayjs

    if (type === "expand") {
      newStart = currentStart.subtract(timePerSide, "minutes")
      newEnd = currentEnd.add(timePerSide, "minutes")
    } else {
      const currentDuration = currentEnd.diff(currentStart, "minutes")
      if (currentDuration <= minutesToMove) {
        return
      }
      newStart = currentStart.add(timePerSide, "minutes")
      newEnd = currentEnd.subtract(timePerSide, "minutes")
    }

    if (newStart.isBefore(config.chartStart.value) || newEnd.isAfter(config.chartEnd.value)) {
      return
    }

    bar[barStart.value] = format(newStart, dateFormat.value)
    bar[barEnd.value] = format(newEnd, dateFormat.value)

    emitDragEvents()
  }

  const emitDragEvents = () => {
    const mockEvent = new MouseEvent("drag", { bubbles: true })
    emitBarEvent(mockEvent, bar)

    const mockEndEvent = new MouseEvent("dragend", { bubbles: true })
    emitBarEvent(mockEndEvent, bar)
  }

  const onBarKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (!target.id || target.id !== bar.ganttBarConfig.id) {
      return
    }

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault()
        moveBar("backward", event.shiftKey)
        break
      case "ArrowRight":
        event.preventDefault()
        moveBar("forward", event.shiftKey)
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
