import { ref } from "vue"
import type { GanttBarObject } from "../types"

export function useTooltip() {
  const showTooltip = ref(false)
  const tooltipBar = ref<GanttBarObject | undefined>(undefined)
  let tooltipTimeoutId: ReturnType<typeof setTimeout>

  const initTooltip = (bar: GanttBarObject) => {
    if (tooltipTimeoutId) {
      clearTimeout(tooltipTimeoutId)
    }
    tooltipTimeoutId = setTimeout(() => {
      showTooltip.value = true
    }, 800)
    tooltipBar.value = bar
  }

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
