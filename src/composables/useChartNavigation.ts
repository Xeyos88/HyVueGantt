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
  const isAtTop = ref(true)
  const isAtBottom = ref(false)

  const updateVerticalScrollState = () => {
    if (!scrollRefs.rowsContainer.value) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRefs.rowsContainer.value
    isAtTop.value = scrollTop === 0
    isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight
  }

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
    updateVerticalScrollState()
  }

  const handleLabelScroll = (scrollTop: number) => {
    if (scrollRefs.rowsContainer.value) {
      scrollRefs.rowsContainer.value.scrollTop = scrollTop
      updateVerticalScrollState()
    }
  }

  const createScrollEvent = (target: HTMLElement): Event => {
    const event = new Event("scroll", {
      bubbles: true,
      cancelable: true
    })
    Object.defineProperty(event, "target", {
      value: target,
      enumerable: true
    })
    return event
  }

  const scrollRowUp = () => {
    if (!scrollRefs.rowsContainer.value) return

    const currentScroll = scrollRefs.rowsContainer.value.scrollTop
    const rowHeight = scrollRefs.rowsContainer.value.firstElementChild?.clientHeight || 0

    scrollRefs.rowsContainer.value.scrollTop = Math.max(0, currentScroll - rowHeight)
    handleContentScroll(createScrollEvent(scrollRefs.rowsContainer.value))
  }

  const scrollRowDown = () => {
    if (!scrollRefs.rowsContainer.value) return

    const currentScroll = scrollRefs.rowsContainer.value.scrollTop
    const rowHeight = scrollRefs.rowsContainer.value.firstElementChild?.clientHeight || 0
    const maxScroll =
      scrollRefs.rowsContainer.value.scrollHeight - scrollRefs.rowsContainer.value.clientHeight

    scrollRefs.rowsContainer.value.scrollTop = Math.min(maxScroll, currentScroll + rowHeight)
    handleContentScroll(createScrollEvent(scrollRefs.rowsContainer.value))
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
    maxZoom,
    ganttPosition,
    ganttStep,
    handleStep,
    handleScroll,
    handleWheel,
    decreaseZoom,
    increaseZoom,
    handleContentScroll,
    handleLabelScroll,
    scrollRowUp,
    scrollRowDown,
    isAtTop,
    isAtBottom
  }
}
