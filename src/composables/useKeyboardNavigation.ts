import { type Ref } from "vue"
import type { UseChartNavigationReturn } from "../types/navigation"

/**
 * A composable that manages keyboard navigation within the Gantt chart
 * Provides keyboard shortcuts for zooming, scrolling, and navigation
 * @param chartNavigation - Object containing chart navigation methods
 * @param wrapperRef - Reference to chart wrapper element
 * @param ganttContainerRef - Reference to main Gantt container
 * @returns Object containing keyboard event handler
 */
export function useKeyboardNavigation(
  chartNavigation: UseChartNavigationReturn,
  wrapperRef: Ref<HTMLElement | null>,
  ganttContainerRef: Ref<HTMLElement | null>
) {
  const { handleStep, decreaseZoom, increaseZoom, ganttPosition, ganttStep } = chartNavigation

  /**
   * Map of keyboard shortcuts to their corresponding actions
   * Each key defines a specific navigation or zoom operation
   */
  const KEYBOARD_MAPPINGS = {
    /**
     * Left arrow key: Move chart view left
     * Checks if movement is possible before execution
     */
    ArrowLeft: () => {
      if (wrapperRef.value && ganttPosition.value > 0) {
        handleStep(ganttPosition.value - ganttStep.value, wrapperRef.value)
      }
    },

    /**
     * Right arrow key: Move chart view right
     * Checks if movement is possible before execution
     */
    ArrowRight: () => {
      if (wrapperRef.value && ganttPosition.value < 100) {
        handleStep(ganttPosition.value + ganttStep.value, wrapperRef.value)
      }
    },

    /**
     * Plus key: Increase zoom level
     */
    "+": () => {
      increaseZoom()
    },

    /**
     * Minus key: Decrease zoom level
     */
    "-": () => {
      decreaseZoom()
    },

    /**
     * Home key: Move chart view to the start
     */
    Home: () => {
      if (wrapperRef.value) {
        handleStep(0, wrapperRef.value)
      }
    },

    /**
     * End key: Move chart view to the end
     */
    End: () => {
      if (wrapperRef.value) {
        handleStep(100, wrapperRef.value)
      }
    },

    /**
     * Page Up key: Move chart view left by larger increment
     */
    PageUp: () => {
      if (wrapperRef.value && ganttPosition.value >= 10) {
        handleStep(ganttPosition.value - 10, wrapperRef.value)
      } else if (wrapperRef.value) {
        handleStep(0, wrapperRef.value)
      }
    },

    /**
     * Page Down key: Move chart view right by larger increment
     */
    PageDown: () => {
      if (wrapperRef.value && ganttPosition.value <= 90) {
        handleStep(ganttPosition.value + 10, wrapperRef.value)
      } else if (wrapperRef.value) {
        handleStep(100, wrapperRef.value)
      }
    }
  }

  /**
   * Main keyboard event handler
   * Processes keyboard events and triggers corresponding actions
   * Only handles events when the Gantt container is focused
   * @param event - Keyboard event to handle
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (!ganttContainerRef.value || target !== ganttContainerRef.value) {
      return
    }

    const action = KEYBOARD_MAPPINGS[event.key as keyof typeof KEYBOARD_MAPPINGS]
    if (action) {
      event.preventDefault()
      action()
    }
  }

  return {
    handleKeyDown
  }
}
