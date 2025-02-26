/**
 * A composable that manages section resizing in the Gantt chart
 * Provides functionality for mouse and touch-based resizing of columns and sections
 * @returns Object containing resize state and event handlers
 */
import { ref } from "vue"

interface ResizeState {
  isResizing: boolean
  startX: number
  startWidth: number
}

export const useSectionResize = () => {
  const resizeState = ref<ResizeState>({
    isResizing: false,
    startX: 0,
    startWidth: 0
  })

  /**
   * Resets resize state to initial values
   * Called when resize operation ends or is cancelled
   */
  const resetResizeState = () => {
    resizeState.value = {
      isResizing: false,
      startX: 0,
      startWidth: 0
    }
  }

  /**
   * Initializes mouse resize operation
   * Sets up initial state and appropriate cursor
   * @param e - Mouse event that initiated the resize
   * @param currentWidth - Current width of the element being resized
   */
  const handleResizeStart = (e: MouseEvent, currentWidth: number) => {
    e.preventDefault()
    resizeState.value = {
      isResizing: true,
      startX: e.clientX,
      startWidth: currentWidth
    }
    document.body.style.cursor = "col-resize"
  }

  /**
   * Handles mouse movement during resize
   * Calculates new width based on mouse position
   * @param e - Mouse move event during resize
   * @param onResize - Callback to call with calculated new width
   */
  const handleResizeMove = (e: MouseEvent, onResize: (newWidth: number) => void) => {
    if (!resizeState.value.isResizing) return

    e.preventDefault()
    const deltaX = e.clientX - resizeState.value.startX
    const newWidth = Math.max(0, resizeState.value.startWidth + deltaX)
    onResize(newWidth)
  }

  /**
   * Finalizes mouse resize operation
   * Restores cursor and resets state
   */
  const handleResizeEnd = () => {
    if (resizeState.value.isResizing) {
      document.body.style.cursor = ""
      resetResizeState()
    }
  }

  /**
   * Initializes touch resize operation
   * Sets up initial state for touch interactions
   * @param e - Touch event that initiated the resize
   * @param currentWidth - Current width of the element being resized
   */
  const handleTouchStart = (e: TouchEvent, currentWidth: number) => {
    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()
    resizeState.value = {
      isResizing: true,
      startX: touch.clientX,
      startWidth: currentWidth
    }
  }

  /**
   * Handles touch movement during resize
   * Calculates new width based on touch position
   * @param e - Touch move event during resize
   * @param onResize - Callback to call with calculated new width
   */
  const handleTouchMove = (e: TouchEvent, onResize: (newWidth: number) => void) => {
    if (!resizeState.value.isResizing) return

    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()
    const deltaX = touch.clientX - resizeState.value.startX
    const newWidth = Math.max(0, resizeState.value.startWidth + deltaX)
    onResize(newWidth)
  }

  return {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    handleTouchStart,
    handleTouchMove,
    resetResizeState
  }
}
