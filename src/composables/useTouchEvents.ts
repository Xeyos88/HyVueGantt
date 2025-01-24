import { ref } from "vue"
import type { GanttBarObject } from "../types"

interface TouchState {
  isDragging: boolean
  startX: number
  startY: number
  lastX: number
  lastY: number
  currentBar: GanttBarObject | null
  dragTarget: "bar" | "leftHandle" | "rightHandle" | null
}

export function useTouchEvents(
  initDragCallback: (bar: GanttBarObject, e: MouseEvent) => void,
  threshold: number = 5
) {
  const touchState = ref<TouchState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    currentBar: null,
    dragTarget: null
  })

  const resetTouchState = () => {
    touchState.value = {
      isDragging: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      currentBar: null,
      dragTarget: null
    }
  }

  const determineDragTarget = (
    element: HTMLElement
  ): "bar" | "leftHandle" | "rightHandle" | null => {
    if (element.classList.contains("g-gantt-bar-handle-left")) {
      return "leftHandle"
    }
    if (element.classList.contains("g-gantt-bar-handle-right")) {
      return "rightHandle"
    }
    if (element.classList.contains("g-gantt-bar")) {
      return "bar"
    }
    const barElement = element.closest(".g-gantt-bar")
    if (barElement) {
      return "bar"
    }
    return null
  }

  const createMouseEventFromTouch = (
    touch: Touch,
    eventType: "mousedown" | "mousemove" | "mouseup",
    movementX = 0,
    movementY = 0
  ): MouseEvent => {
    const mouseEvent = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
      movementX,
      movementY,
      view: window
    })

    if (touchState.value.currentBar) {
      const targetElement = document.querySelector(
        `#${touchState.value.currentBar.ganttBarConfig.id}`
      )
      if (targetElement) {
        Object.defineProperty(mouseEvent, "target", { value: targetElement })
      }
    }

    return mouseEvent
  }

  const handleTouchStart = (event: TouchEvent, bar?: GanttBarObject) => {
    const touch = event.touches[0]
    if (!touch || !bar) return

    const targetElement = event.target as HTMLElement
    if (!targetElement) return

    const dragTarget = determineDragTarget(targetElement)
    if (!dragTarget) return

    event.preventDefault()

    touchState.value = {
      isDragging: false,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      currentBar: bar,
      dragTarget
    }

    const mouseEvent = createMouseEventFromTouch(touch, "mousedown")
    initDragCallback(bar, mouseEvent)
  }

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch || !touchState.value.currentBar) return

    const deltaX = Math.abs(touch.clientX - touchState.value.startX)
    const deltaY = Math.abs(touch.clientY - touchState.value.startY)

    if (!touchState.value.isDragging && (deltaX > threshold || deltaY > threshold)) {
      touchState.value.isDragging = true
    }

    if (touchState.value.isDragging) {
      event.preventDefault()

      const movementX = touch.clientX - touchState.value.lastX
      const movementY = touch.clientY - touchState.value.lastY

      touchState.value.lastX = touch.clientX
      touchState.value.lastY = touch.clientY

      const mouseEvent = createMouseEventFromTouch(touch, "mousemove", movementX, movementY)
      window.dispatchEvent(mouseEvent)
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0]
    if (!touch || !touchState.value.currentBar) return

    if (touchState.value.isDragging) {
      event.preventDefault()
      const mouseEvent = createMouseEventFromTouch(touch, "mouseup")
      window.dispatchEvent(mouseEvent)
    }

    resetTouchState()
  }

  const handleTouchCancel = handleTouchEnd

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  }
}
