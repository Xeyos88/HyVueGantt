import { type Ref } from "vue"
import type { UseChartNavigationReturn } from "../types/navigation"

export function useKeyboardNavigation(
  chartNavigation: UseChartNavigationReturn,
  wrapperRef: Ref<HTMLElement | null>,
  ganttContainerRef: Ref<HTMLElement | null>
) {
  const { handleStep, decreaseZoom, increaseZoom, ganttPosition, ganttStep } = chartNavigation

  const KEYBOARD_MAPPINGS = {
    ArrowLeft: () => {
      if (wrapperRef.value && ganttPosition.value > 0) {
        handleStep(ganttPosition.value - ganttStep.value, wrapperRef.value)
      }
    },
    ArrowRight: () => {
      if (wrapperRef.value && ganttPosition.value < 100) {
        handleStep(ganttPosition.value + ganttStep.value, wrapperRef.value)
      }
    },
    "+": () => {
      increaseZoom()
    },
    "-": () => {
      decreaseZoom()
    },
    Home: () => {
      if (wrapperRef.value) {
        handleStep(0, wrapperRef.value)
      }
    },
    End: () => {
      if (wrapperRef.value) {
        handleStep(100, wrapperRef.value)
      }
    },
    PageUp: () => {
      if (wrapperRef.value && ganttPosition.value >= 10) {
        handleStep(ganttPosition.value - 10, wrapperRef.value)
      } else if (wrapperRef.value) {
        handleStep(0, wrapperRef.value)
      }
    },
    PageDown: () => {
      if (wrapperRef.value && ganttPosition.value <= 90) {
        handleStep(ganttPosition.value + 10, wrapperRef.value)
      } else if (wrapperRef.value) {
        handleStep(100, wrapperRef.value)
      }
    }
  }

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
