// useKeyboardNavigation.ts

import { type Ref } from "vue"

interface NavigationControls {
  scrollPosition: Ref<number>
  handleStep: (value: number, wrapper: HTMLElement) => void
  handleZoomUpdate: (increase: boolean) => void
}

export function useKeyboardNavigation(
  chartNavigation: NavigationControls,
  wrapperRef: Ref<HTMLElement | null>,
  ganttContainerRef: Ref<HTMLElement | null>
) {
  const { handleStep, handleZoomUpdate, scrollPosition } = chartNavigation

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (!ganttContainerRef.value || target !== ganttContainerRef.value) {
      return
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
