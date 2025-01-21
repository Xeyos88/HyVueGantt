import { ref, computed, type Ref, nextTick } from "vue"
import type useTimeaxisUnits from "./useTimeaxisUnits"

/**
 * Interface defining DOM references needed for scrolling functionality
 */
interface ScrollRefs {
  rowsContainer: Ref<HTMLElement | null>
  labelColumn: Ref<any>
}

/**
 * Interface defining chart navigation configuration options
 */
interface ChartNavigationOptions {
  scrollRefs: ScrollRefs
  updateBarPositions: () => void
  timeaxisUnits: ReturnType<typeof useTimeaxisUnits>
}

/**
 * Composable that manages navigation within the Gantt chart.
 * Provides functionality for horizontal/vertical scrolling and zoom controls.
 *
 * @param options - Configuration options for navigation
 * @param maxRows - Maximum number of rows that can be displayed simultaneously
 * @returns Object containing navigation state and methods
 */
export function useChartNavigation(options: ChartNavigationOptions, maxRows: number) {
  const { scrollRefs, updateBarPositions, timeaxisUnits } = options
  const { adjustZoomAndPrecision } = timeaxisUnits

  const scrollPosition = ref(0)
  const isAtTop = ref(true)
  const isAtBottom = ref(false)

  /**
   * Calculates total width of viewable content
   */
  const totalWidth = computed(() => {
    return timeaxisUnits.timeaxisUnits.value.result.lowerUnits.reduce((total, unit) => {
      return total + parseInt(unit.width!)
    }, 0)
  })

  /**
   * Handles moving to a specific position
   * @param newPosition - New percentage position (0-100)
   * @param wrapper - Container DOM element
   */
  const handleStep = (newPosition: number, wrapper: HTMLElement) => {
    const maxScroll = totalWidth.value - wrapper.clientWidth
    const targetScroll = (maxScroll * newPosition) / 100
    wrapper.scrollLeft = targetScroll
    scrollPosition.value = newPosition
  }

  /**
   * Handles manual scrolling through the slider
   * @param wrapper - Container DOM element
   */
  const handleScroll = (wrapper: HTMLElement) => {
    const maxScroll = totalWidth.value - wrapper.clientWidth
    const targetScroll = (maxScroll * scrollPosition.value) / 100
    wrapper.scrollLeft = targetScroll
  }

  /**
   * Handles mouse wheel event for scrolling
   * @param e - Mouse wheel event
   * @param wrapper - Container DOM element
   */
  const handleWheel = (e: WheelEvent, wrapper: HTMLElement) => {
    if (maxRows !== 0) {
      if (e.deltaX !== 0) {
        e.preventDefault()
      }
      return
    }

    wrapper.scrollLeft += e.deltaX || e.deltaY
    const maxScroll = totalWidth.value - wrapper.clientWidth
    scrollPosition.value = (wrapper.scrollLeft / maxScroll) * 100
  }

  /**
   * Handles zoom level updates
   * @param increase - If true increases zoom, otherwise decreases
   */
  const handleZoomUpdate = async (increase: boolean) => {
    adjustZoomAndPrecision(increase)
    await nextTick()
    updateBarPositions()
  }

  /**
   * Handles main content scrolling
   * Synchronizes scroll with label column
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
   * Synchronizes scroll with main content
   * @param scrollTop - Vertical scroll position
   */
  const handleLabelScroll = (scrollTop: number) => {
    if (scrollRefs.rowsContainer.value) {
      scrollRefs.rowsContainer.value.scrollTop = scrollTop
      updateVerticalScrollState()
    }
  }

  /**
   * Updates vertical scroll state
   * Checks if view is at top or bottom
   */
  const updateVerticalScrollState = () => {
    if (!scrollRefs.rowsContainer.value) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRefs.rowsContainer.value
    isAtTop.value = scrollTop === 0
    isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight
  }

  /**
   * Scrolls one row up
   */
  const scrollRowUp = () => {
    if (!scrollRefs.rowsContainer.value) return

    const currentScroll = scrollRefs.rowsContainer.value.scrollTop
    const rowHeight = scrollRefs.rowsContainer.value.firstElementChild?.clientHeight || 0

    scrollRefs.rowsContainer.value.scrollTop = Math.max(0, currentScroll - rowHeight)
    handleContentScroll(createScrollEvent(scrollRefs.rowsContainer.value))
  }

  /**
   * Scrolls one row down
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
   * Creates a synthetic scroll event
   * @param target - Target element for the event
   * @returns Scroll event
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

  return {
    scrollPosition,
    isAtTop,
    isAtBottom,
    handleStep,
    handleScroll,
    handleWheel,
    handleContentScroll,
    handleLabelScroll,
    handleZoomUpdate,
    scrollRowUp,
    scrollRowDown
  }
}
