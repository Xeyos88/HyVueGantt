import { ref } from "vue"
import type { GanttBarObject, GGanttChartConfig } from "../types"
import useDayjsHelper from "./useDayjsHelper"
import useTimePositionMapping from "./useTimePositionMapping"
import type { MovementAPI } from "./useBarMovement"
import useBarSelector from "./useBarSelector"

export default function createBarDrag(
  bar: GanttBarObject,
  onDrag: (e: MouseEvent, bar: GanttBarObject) => void = () => null,
  onEndDrag: (e: MouseEvent, bar: GanttBarObject) => void = () => null,
  config: GGanttChartConfig,
  movementAPI: MovementAPI,
  ganttId: string
) {
  const { findBarElement } = useBarSelector()
  const { barStart, barEnd } = config
  const isDragging = ref(false)
  let cursorOffsetX = 0
  let dragCallBack: (e: MouseEvent) => void

  const { mapPositionToTime } = useTimePositionMapping(config)
  const { toDayjs } = useDayjsHelper(config)

  const initDrag = (e: MouseEvent) => {
    if (bar.ganttBarConfig.immobile) {
      return
    }
    const barElement = findBarElement(ganttId!, bar.ganttBarConfig.id)
    if (!barElement) {
      return
    }

    cursorOffsetX = e.clientX - (barElement.getBoundingClientRect().left || 0)
    const mousedownType = (e.target as Element).className
    switch (mousedownType) {
      case "g-gantt-bar-handle-left":
        document.body.style.cursor = "ew-resize"
        dragCallBack = dragByLeftHandle
        break
      case "g-gantt-bar-handle-right":
        document.body.style.cursor = "ew-resize"
        dragCallBack = dragByRightHandle
        break
      default:
        dragCallBack = drag
    }
    isDragging.value = true
    window.addEventListener("mousemove", dragCallBack)
    window.addEventListener("mouseup", endDrag)
  }

  const getBarElements = () => {
    const barElement = findBarElement(ganttId!, bar.ganttBarConfig.id)
    const barContainer = barElement?.closest(".g-gantt-row-bars-container")?.getBoundingClientRect()
    return { barElement, barContainer }
  }

  const drag = (e: MouseEvent) => {
    const { barElement, barContainer } = getBarElements()
    if (!barElement || !barContainer) {
      return
    }

    const barWidth = barElement.getBoundingClientRect().width
    const xStart = e.clientX - barContainer.left - cursorOffsetX
    const xEnd = xStart + barWidth

    const newBarStart = mapPositionToTime(xStart) as string
    const newBarEnd = mapPositionToTime(xEnd) as string

    const currentStart = bar[barStart.value]
    const currentEnd = bar[barEnd.value]

    const result = movementAPI.moveBar(bar, newBarStart, newBarEnd)
    if (!result.success) {
      bar[barStart.value] = currentStart
      bar[barEnd.value] = currentEnd
      endDrag(e)
      return
    }

    onDrag(e, bar)
  }

  const dragByLeftHandle = (e: MouseEvent) => {
    const { barContainer } = getBarElements()
    if (!barContainer) {
      return
    }

    const xStart = e.clientX - barContainer.left
    const newBarStart = mapPositionToTime(xStart) as string

    if (toDayjs(newBarStart).isSameOrAfter(toDayjs(bar[barEnd.value]))) {
      return
    }

    const result = movementAPI.moveBar(bar, newBarStart, bar[barEnd.value])
    if (result.success) {
      onDrag(e, bar)
    }
  }

  const dragByRightHandle = (e: MouseEvent) => {
    const { barContainer } = getBarElements()
    if (!barContainer) {
      return
    }

    const xEnd = e.clientX - barContainer.left
    const newBarEnd = mapPositionToTime(xEnd) as string

    if (toDayjs(newBarEnd).isSameOrBefore(toDayjs(bar[barStart.value]))) {
      return
    }

    const result = movementAPI.moveBar(bar, bar[barStart.value], newBarEnd)
    if (result.success) {
      onDrag(e, bar)
    }
  }

  const endDrag = (e: MouseEvent) => {
    isDragging.value = false
    document.body.style.cursor = ""
    window.removeEventListener("mousemove", dragCallBack)
    window.removeEventListener("mouseup", endDrag)
    onEndDrag(e, bar)
  }

  return {
    isDragging,
    initDrag
  }
}
