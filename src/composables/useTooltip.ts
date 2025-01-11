import { ref } from "vue"
import type { GanttBarObject } from "../types"

/**
 * A composable that manages tooltip display and behavior in the Gantt chart
 * Provides timeout-based show/hide functionality and bar reference tracking
 * @returns Object containing tooltip state and control methods
 */
export function useTooltip() {
  const showTooltip = ref(false)
  const tooltipBar = ref<GanttBarObject | undefined>(undefined)
  let tooltipTimeoutId: ReturnType<typeof setTimeout>

  /**
   * Initializes tooltip display for a bar
   * Sets up delayed showing of tooltip after hover
   * @param bar - Bar to show tooltip for
   */
  const initTooltip = (bar: GanttBarObject) => {
    if (tooltipTimeoutId) {
      clearTimeout(tooltipTimeoutId)
    }
    tooltipTimeoutId = setTimeout(() => {
      showTooltip.value = true
    }, 800)
    tooltipBar.value = bar
  }

  /**
   * Clears tooltip display and cancels any pending tooltip
   * Used when mouse leaves bar or on explicit clear request
   */
  const clearTooltip = () => {
    clearTimeout(tooltipTimeoutId)
    showTooltip.value = false
  }

  return {
    showTooltip,
    tooltipBar,
    initTooltip,
    clearTooltip
  }
}
