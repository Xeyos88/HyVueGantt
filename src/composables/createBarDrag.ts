import { ref } from "vue"
import type { GanttBarObject, GGanttChartConfig } from "../types"
import useDayjsHelper from "./useDayjsHelper"
import useTimePositionMapping from "./useTimePositionMapping"
import type { MovementAPI } from "./useBarMovement"
import useBarSelector from "./useBarSelector"

/**
 * Creates drag functionality for a Gantt chart bar
 * Handles different types of drag behaviors including full bar dragging and edge resizing
 * @param bar - The Gantt bar object to add drag functionality to
 * @param onDrag - Callback function called during drag
 * @param onEndDrag - Callback function called when drag ends
 * @param config - Gantt chart configuration object
 * @param movementAPI - API for handling bar movement constraints
 * @param ganttId - ID of the Gantt chart instance
 * @returns Object containing drag state and initialization method
 */
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
  let initialBarLeft = 0
  let dragCallBack: (e: MouseEvent) => void

  const { mapPositionToTime } = useTimePositionMapping(config)
  const { toDayjs } = useDayjsHelper(config)

  /**
   * Initializes drag functionality for a bar
   * Sets up appropriate drag behavior based on where the drag started (handle or body)
   * @param e - Mouse event that initiated the drag
   */
  const initDrag = (e: MouseEvent) => {
    if (bar.ganttBarConfig.immobile) {
      return
    }
    const barElement = findBarElement(ganttId!, bar.ganttBarConfig.id)
    if (!barElement) {
      return
    }

    const rect = barElement.getBoundingClientRect()
    initialBarLeft = rect.left
    cursorOffsetX = e.clientX - initialBarLeft
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

  /**
   * Retrieves the bar element and its container
   * Helper function used by drag handlers
   * @returns Object containing bar element and container references
   */
  const getBarElements = () => {
    const barElement = findBarElement(ganttId!, bar.ganttBarConfig.id)
    let currentElement = barElement
    let barContainer = null
    while (currentElement && !barContainer) {
      const container = currentElement.closest(".g-gantt-row-bars-container")
      if (container) {
        barContainer = container.getBoundingClientRect()
      }
      currentElement = currentElement.parentElement
    }
    return { barElement, barContainer }
  }

  /**
   * Handles dragging of the entire bar
   * Updates bar position while maintaining its duration
   * @param e - Mouse move event during drag
   */
  const drag = (e: MouseEvent) => {
    const { barElement, barContainer } = getBarElements()
    if (!barElement || !barContainer) {
      console.warn("Missing elements:", { barElement, barContainer })
      return
    }

    const barWidth = barElement.getBoundingClientRect().width
    const relativeX = e.clientX - cursorOffsetX - barContainer.left
    const xStart = Math.max(0, relativeX)
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

  /**
   * Handles dragging of the left handle to resize the bar
   * Updates bar start time while maintaining end time
   * @param e - Mouse move event during drag
   */
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

  /**
   * Handles dragging of the right handle to resize the bar
   * Updates bar end time while maintaining start time
   * @param e - Mouse move event during drag
   */
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

  /**
   * Handles the end of a drag operation
   * Cleans up event listeners and triggers the onEndDrag callback
   * @param e - Mouse up event that ended the drag
   */
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
