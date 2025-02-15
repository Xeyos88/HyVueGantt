import type { BarConnection } from "../types"
import { type Ref } from "vue"

/**
 * Interface defining the navigation control methods and state
 * Contains the essential methods and values needed for keyboard-based navigation
 */
interface NavigationControls {
  scrollPosition: Ref<number>
  handleStep: (value: number, wrapper: HTMLElement) => void
  handleZoomUpdate: (increase: boolean) => void
}

interface ConnectionControls {
  selectedConnection: Ref<BarConnection | null>
  deleteSelectedConnection: () => void
}

/**
 * A composable that provides keyboard navigation functionality for the Gantt chart
 * Allows users to navigate and control the chart using keyboard shortcuts
 *
 * @param chartNavigation - Object containing navigation control methods
 * @param wrapperRef - Reference to the chart wrapper element
 * @param ganttContainerRef - Reference to the main Gantt container
 * @returns Object containing keyboard event handler
 */
export function useKeyboardNavigation(
  chartNavigation: NavigationControls,
  wrapperRef: Ref<HTMLElement | null>,
  ganttContainerRef: Ref<HTMLElement | null>,
  connectionControls: ConnectionControls,
  enableConnectionDeletion: Ref<boolean>
) {
  const { handleStep, handleZoomUpdate, scrollPosition } = chartNavigation
  const { selectedConnection, deleteSelectedConnection } = connectionControls

  /**
   * Handles keyboard events for chart navigation
   * Implements the following controls:
   * - ArrowLeft/Right: Moves chart view left/right
   * - +/-: Zooms in/out
   * - Home/End: Jumps to start/end
   * - PageUp/Down: Moves chart view by larger increments
   *
   * @param event - Keyboard event to handle
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (!ganttContainerRef.value || target !== ganttContainerRef.value) {
      return
    }

    if (selectedConnection.value && enableConnectionDeletion.value) {
      switch (event.key) {
        case "Delete":
          deleteSelectedConnection()
          return
        case "Escape":
          selectedConnection.value = null
          return
      }
    }

    switch (event.key) {
      case "ArrowLeft":
        if (wrapperRef.value && scrollPosition.value > 0) {
          handleStep(Math.max(0, scrollPosition.value - 10), wrapperRef.value)
        }
        break

      case "ArrowRight":
        if (wrapperRef.value && scrollPosition.value < 100) {
          handleStep(Math.min(100, scrollPosition.value + 10), wrapperRef.value)
        }
        break

      case "+":
        handleZoomUpdate(true)
        break

      case "-":
        handleZoomUpdate(false)
        break

      case "Home":
        if (wrapperRef.value) {
          handleStep(0, wrapperRef.value)
        }
        break

      case "End":
        if (wrapperRef.value) {
          handleStep(100, wrapperRef.value)
        }
        break

      case "PageUp":
        if (wrapperRef.value && scrollPosition.value >= 10) {
          handleStep(scrollPosition.value - 10, wrapperRef.value)
        } else if (wrapperRef.value) {
          handleStep(0, wrapperRef.value)
        }
        break

      case "PageDown":
        if (wrapperRef.value && scrollPosition.value <= 90) {
          handleStep(scrollPosition.value + 10, wrapperRef.value)
        } else if (wrapperRef.value) {
          handleStep(100, wrapperRef.value)
        }
        break
    }
  }

  return {
    handleKeyDown
  }
}
