import { ref, computed } from "vue"

interface ChartNavigationOptions {
  diffDays: number
  diffHours: number
}

export function useChartNavigation(options: ChartNavigationOptions) {
  const { diffDays, diffHours } = options

  const zoomFactor = ref(diffDays)
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
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth
    wrapper.scrollLeft += e.deltaX || e.deltaY
    ganttPosition.value = (wrapper.scrollLeft / maxScroll) * 100
  }

  const decreaseZoom = () => {
    if (zoomFactor.value === 1) return
    zoomFactor.value = zoomFactor.value - 1
  }

  const increaseZoom = () => {
    if (zoomFactor.value === 10) return
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
    increaseZoom
  }
}
