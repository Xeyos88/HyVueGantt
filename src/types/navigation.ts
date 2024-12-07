import type { Ref } from "vue"

export interface UseChartNavigationReturn {
  zoomFactor: Ref<number>
  ganttPosition: Ref<number>
  ganttStep: Ref<number>
  handleStep: (value: number, wrapper: HTMLElement) => void
  handleScroll: (wrapper: HTMLElement) => void
  handleWheel: (e: WheelEvent, wrapper: HTMLElement) => void
  decreaseZoom: () => void
  increaseZoom: () => void
}
