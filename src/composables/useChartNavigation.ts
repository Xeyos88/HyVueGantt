// useChartNavigation.ts

import { ref, computed, type Ref, nextTick } from "vue"
import type useTimeaxisUnits from "./useTimeaxisUnits"

interface ScrollRefs {
  rowsContainer: Ref<HTMLElement | null>
  labelColumn: Ref<any>
}

interface ChartNavigationOptions {
  scrollRefs: ScrollRefs
  updateBarPositions: () => void
  timeaxisUnits: ReturnType<typeof useTimeaxisUnits>
}

export function useChartNavigation(options: ChartNavigationOptions, maxRows: number) {
  const { scrollRefs, updateBarPositions, timeaxisUnits } = options
  const { adjustZoomAndPrecision } = timeaxisUnits

  const scrollPosition = ref(0)
  const isAtTop = ref(true)
  const isAtBottom = ref(false)

  const totalWidth = computed(() => {
    return timeaxisUnits.timeaxisUnits.value.result.lowerUnits.reduce((total, unit) => {
      return total + parseInt(unit.width!)
    }, 0)
  })

  const handleStep = (newPosition: number, wrapper: HTMLElement) => {
    const maxScroll = totalWidth.value - wrapper.clientWidth
    const targetScroll = (maxScroll * newPosition) / 100
    wrapper.scrollLeft = targetScroll
    scrollPosition.value = newPosition
  }

  const handleScroll = (wrapper: HTMLElement) => {
    const maxScroll = totalWidth.value - wrapper.clientWidth
    const targetScroll = (maxScroll * scrollPosition.value) / 100
    wrapper.scrollLeft = targetScroll
  }

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

  const handleZoomUpdate = async (increase: boolean) => {
    adjustZoomAndPrecision(increase)
    await nextTick()
    updateBarPositions()
  }

  // Gestione scroll verticale
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

  const updateVerticalScrollState = () => {
    if (!scrollRefs.rowsContainer.value) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRefs.rowsContainer.value
    isAtTop.value = scrollTop === 0
    isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight
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
