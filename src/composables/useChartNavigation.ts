import { ref, computed, type Ref, nextTick } from "vue"

/**
 * Interface defining scroll-related elements references
 */
interface ScrollRefs {
  rowsContainer: Ref<HTMLElement | null>
  labelColumn: Ref<any>
}

/**
 * Interface for chart navigation options
 */
interface ChartNavigationOptions {
  diffDays: number
  diffHours: number
  scrollRefs: ScrollRefs
  updateBarPositions: () => void
}

/**
 * A composable that manages navigation within the Gantt chart
 * Handles zooming, scrolling, and position tracking
 * @param options - Navigation configuration options
 * @param maxRows - Maximum number of visible rows
 * @returns Object containing navigation state and methods
 */
export function useChartNavigation(options: ChartNavigationOptions, maxRows: number) {
  const { diffDays, diffHours, scrollRefs, updateBarPositions } = options

  const zoomFactor = ref(diffDays)
  const maxZoom = ref(Math.max(10, 5 * diffDays))
  const ganttPosition = ref(0)
  const ganttStep = computed(() => 100 / diffHours)
  const isAtTop = ref(true)
  const isAtBottom = ref(false)

  /**
   * Updates the vertical scroll state indicators
   * Tracks when the view is at top or bottom
   */
  const updateVerticalScrollState = () => {
    if (!scrollRefs.rowsContainer.value) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRefs.rowsContainer.value
    isAtTop.value = scrollTop === 0
    isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight
  }

  /**
   * Handles moving to a specific position in the chart
   * @param value - Position value (0-100)
   * @param wrapper - Chart wrapper element
   */
  const handleStep = (value: number, wrapper: HTMLElement) => {
    ganttPosition.value = value
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth
    const scrollValue = (maxScroll * ganttPosition.value) / 100
    wrapper.scrollLeft = scrollValue
  }

  /**
   * Handles scroll position updates
   * @param wrapper - Chart wrapper element
   */
  const handleScroll = (wrapper: HTMLElement) => {
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth
    const scrollValue = (maxScroll * ganttPosition.value) / 100
    wrapper.scrollLeft = scrollValue
  }

  /**
   * Handles mouse wheel events for chart navigation
   * @param e - Wheel event
   * @param wrapper - Chart wrapper element
   */
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

  /**
   * Handles content area scrolling
   * Synchronizes label column scroll position
   * @param e - Scroll event
   */
  const handleContentScroll = (e: Event) => {
    const target = e.target as HTMLElement
    if (scrollRefs.labelColumn.value) {
      scrollRefs.labelColumn.value.setScroll(target.scrollTop)
    }
    updateVerticalScrollState()
  }

  /**
   * Handles label column scrolling
   * Synchronizes content area scroll position
   * @param scrollTop - Vertical scroll position
   */
  const handleLabelScroll = (scrollTop: number) => {
    if (scrollRefs.rowsContainer.value) {
      scrollRefs.rowsContainer.value.scrollTop = scrollTop
      updateVerticalScrollState()
    }
  }

  /**
   * Creates a synthetic scroll event
   * @param target - Target element for the event
   * @returns Constructed scroll event
   */
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

  /**
   * Scrolls up by one row height
   */
  const scrollRowUp = () => {
    if (!scrollRefs.rowsContainer.value) return

    const currentScroll = scrollRefs.rowsContainer.value.scrollTop
    const rowHeight = scrollRefs.rowsContainer.value.firstElementChild?.clientHeight || 0

    scrollRefs.rowsContainer.value.scrollTop = Math.max(0, currentScroll - rowHeight)
    handleContentScroll(createScrollEvent(scrollRefs.rowsContainer.value))
  }

  /**
   * Scrolls down by one row height
   */
  const scrollRowDown = () => {
    if (!scrollRefs.rowsContainer.value) return

    const currentScroll = scrollRefs.rowsContainer.value.scrollTop
    const rowHeight = scrollRefs.rowsContainer.value.firstElementChild?.clientHeight || 0
    const maxScroll =
      scrollRefs.rowsContainer.value.scrollHeight - scrollRefs.rowsContainer.value.clientHeight

    scrollRefs.rowsContainer.value.scrollTop = Math.min(maxScroll, currentScroll + rowHeight)
    handleContentScroll(createScrollEvent(scrollRefs.rowsContainer.value))
  }

  /**
   * Updates zoom level and refreshes bar positions
   * @param newZoomValue - New zoom level
   */
  const handleZoomUpdate = async (newZoomValue: number) => {
    zoomFactor.value = newZoomValue
    await nextTick()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    updateBarPositions()
  }

  /**
   * Decreases zoom level
   * @param event - Optional keyboard or mouse event
   */
  const decreaseZoom = async (event?: KeyboardEvent | MouseEvent) => {
    if (zoomFactor.value === 1) return
    const step = event?.shiftKey ? 3 : 1
    const newZoom = Math.max(1, zoomFactor.value - step)
    await handleZoomUpdate(newZoom)
  }

  /**
   * Increases zoom level
   * @param event - Optional keyboard or mouse event
   */
  const increaseZoom = async (event?: KeyboardEvent | MouseEvent) => {
    if (zoomFactor.value === maxZoom.value) return
    const step = event?.shiftKey ? 3 : 1
    const newZoom = Math.min(maxZoom.value, zoomFactor.value + step)
    await handleZoomUpdate(newZoom)
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
