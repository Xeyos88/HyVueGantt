import { ref } from "vue"

interface ResizeState {
  isResizing: boolean
  startX: number
  startWidth: number
}

export function useSectionResize() {
  const resizeState = ref<ResizeState>({
    isResizing: false,
    startX: 0,
    startWidth: 0
  })

  const resetResizeState = () => {
    resizeState.value = {
      isResizing: false,
      startX: 0,
      startWidth: 0
    }
  }

  const handleResizeStart = (e: MouseEvent, currentWidth: number) => {
    e.preventDefault()
    resizeState.value = {
      isResizing: true,
      startX: e.clientX,
      startWidth: currentWidth
    }
    document.body.style.cursor = "col-resize"
  }

  const handleResizeMove = (e: MouseEvent, onResize: (newWidth: number) => void) => {
    if (!resizeState.value.isResizing) return

    e.preventDefault()
    const deltaX = e.clientX - resizeState.value.startX
    const newWidth = Math.max(0, resizeState.value.startWidth + deltaX)
    onResize(newWidth)
  }

  const handleResizeEnd = () => {
    if (resizeState.value.isResizing) {
      document.body.style.cursor = ""
      resetResizeState()
    }
  }

  const handleTouchStart = (e: TouchEvent, currentWidth: number) => {
    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()
    resizeState.value = {
      isResizing: true,
      startX: touch.clientX,
      startWidth: currentWidth
    }
  }

  const handleTouchMove = (e: TouchEvent, onResize: (newWidth: number) => void) => {
    if (!resizeState.value.isResizing) return

    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()
    const deltaX = touch.clientX - resizeState.value.startX
    const newWidth = Math.max(0, resizeState.value.startWidth + deltaX)
    onResize(newWidth)
  }

  return {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    handleTouchStart,
    handleTouchMove,
    resetResizeState
  }
}
