import type { Ref } from "vue"

export interface UseChartNavigationReturn {
  zoomFactor: Ref<number>
  ganttPosition: Ref<number>
  ganttStep: Ref<number>
  handleStep: (value: number, wrapper: HTMLElement) => void
  handleScroll: (wrapper: HTMLElement) => void
  handleWheel: (e: WheelEvent, wrapper: HTMLElement) => void
  handleContentScroll: (e: Event) => void
  handleLabelScroll: (scrollTop: number) => void
  decreaseZoom: () => void
  increaseZoom: () => void
  scrollRowUp: () => void
  scrollRowDown: () => void
}
