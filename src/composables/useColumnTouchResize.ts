import { ref } from "vue"

/**
 * Interface defining the state for touch-based column resizing
 */
export interface TouchResizeState {
  isResizing: boolean
  startX: number
  currentColumn: string | null
  initialWidth: number
}

/**
 * A composable that manages touch-based column resizing functionality
 * Handles touch events and width calculations for responsive column sizing
 * @returns Object containing resize state and event handlers
 */
export function useColumnTouchResize() {
  const touchState = ref<TouchResizeState>({
    isResizing: false,
    startX: 0,
    currentColumn: null,
    initialWidth: 0
  })

  /**
   * Resets resize state to initial values
   * Called when resize operation ends or is cancelled
   */
  const resetTouchState = () => {
    touchState.value = {
      isResizing: false,
      startX: 0,
      currentColumn: null,
      initialWidth: 0
    }
  }

  /**
   * Initializes touch resize operation
   * Sets up initial positions and state for resizing
   * @param e - Touch event that started the resize
   * @param column - Column being resized
   * @param currentWidth - Current width of the column
   */
  const handleTouchStart = (e: TouchEvent, column: string, currentWidth: number) => {
    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()

    touchState.value = {
      isResizing: true,
      startX: touch.clientX,
      currentColumn: column,
      initialWidth: currentWidth
    }
  }

  /**
   * Handles ongoing touch resize movement
   * Calculates and applies new column width
   * @param e - Touch move event
   * @param onResize - Callback function to update column width
   */
  const handleTouchMove = (e: TouchEvent, onResize: (column: string, newWidth: number) => void) => {
    const touch = e.touches[0]
    if (!touch || !touchState.value.isResizing) return

    e.preventDefault()

    const deltaX = touch.clientX - touchState.value.startX
    const newWidth = Math.max(50, touchState.value.initialWidth + deltaX)

    if (touchState.value.currentColumn) {
      onResize(touchState.value.currentColumn, newWidth)
    }
  }

  /**
   * Finalizes touch resize operation
   * Cleans up state and event listeners
   */
  const handleTouchEnd = () => {
    if (touchState.value.isResizing) {
      resetTouchState()
    }
  }

  /**
   * Handles touch cancel event
   * Behaves same as touch end
   */
  const handleTouchCancel = handleTouchEnd

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  }
}
