import { ref, computed, type Ref } from "vue"

interface ScrollRefs {
  rowsContainer: Ref<HTMLElement | null>
  labelColumn: Ref<any>
}
interface ChartNavigationOptions {
  diffDays: number
  diffHours: number
  scrollRefs: ScrollRefs
}

export function useChartNavigation(options: ChartNavigationOptions, maxRows: number) {
  const { diffDays, diffHours, scrollRefs } = options

  const zoomFactor = ref(diffDays)
  const maxZoom = ref(Math.max(10, 5 * diffDays))
  const ganttPosition = ref(0)
  const ganttStep = computed(() => 100 / diffHours)

  const handleStep = (value: number, wrapper: HTMLElement) => {
    ganttPosition.value = value
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth
    const scrollValue = (maxScroll * ganttPosition.value) / 100
    wrapper.scrollLeft = scrollValue
  }

  const handleScroll = (wrapper: HTMLElement) => {
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth
    const scrollValue = (maxScroll * ganttPosition.value) / 100
    wrapper.scrollLeft = scrollValue
  }

  const handleWheel = (e: WheelEvent, wrapper: HTMLElement) => {
    if (maxRows !== 0) {
      if (e.deltaX !== 0) {
        e.preventDefault()
      }
      return
    }

    wrapper.scrollLeft += e.deltaX || e.deltaY
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth
    ganttPosition.value = (wrapper.scrollLeft / maxScroll) * 100
  }

  const handleContentScroll = (e: Event) => {
    const target = e.target as HTMLElement
    if (scrollRefs.labelColumn.value) {
      scrollRefs.labelColumn.value.setScroll(target.scrollTop)
    }
  }

  const handleLabelScroll = (scrollTop: number) => {
    if (scrollRefs.rowsContainer.value) {
      scrollRefs.rowsContainer.value.scrollTop = scrollTop
    }
  }

  const decreaseZoom = () => {
    if (zoomFactor.value === 1) return
    zoomFactor.value = zoomFactor.value - 1
  }
  const increaseZoom = () => {
    if (zoomFactor.value === maxZoom.value) return
    zoomFactor.value = zoomFactor.value + 1
  }

  return {
    zoomFactor,
    ganttPosition,
    ganttStep,
    handleStep,
    handleScroll,
    handleWheel,
    decreaseZoom,
    increaseZoom,
    handleContentScroll,
    handleLabelScroll
  }
}
