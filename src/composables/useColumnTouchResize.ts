import { ref } from "vue"

interface TouchResizeState {
  isResizing: boolean
  startX: number
  currentColumn: string | null
  initialWidth: number
}

export function useColumnTouchResize() {
  const touchState = ref<TouchResizeState>({
    isResizing: false,
    startX: 0,
    currentColumn: null,
    initialWidth: 0
  })

  const resetTouchState = () => {
    touchState.value = {
      isResizing: false,
      startX: 0,
      currentColumn: null,
      initialWidth: 0
    }
  }

  const handleTouchStart = (e: TouchEvent, column: string, currentWidth: number) => {
    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()

    touchState.value = {
      isResizing: true,
      startX: touch.clientX,
      currentColumn: column,
      initialWidth: currentWidth
    }
  }

  const handleTouchMove = (e: TouchEvent, onResize: (column: string, newWidth: number) => void) => {
    const touch = e.touches[0]
    if (!touch || !touchState.value.isResizing) return

    e.preventDefault()

    const deltaX = touch.clientX - touchState.value.startX
    const newWidth = Math.max(50, touchState.value.initialWidth + deltaX)

    if (touchState.value.currentColumn) {
      onResize(touchState.value.currentColumn, newWidth)
    }
  }

  const handleTouchEnd = () => {
    if (touchState.value.isResizing) {
      resetTouchState()
    }
  }

  const handleTouchCancel = handleTouchEnd

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  }
}
