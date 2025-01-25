import { ref } from 'vue'
import type { ChartRow } from '../types'

interface TouchDragState {
  isDragging: boolean
  startY: number
  currentY: number
  draggedRow: ChartRow | null
  dropTarget: {
    row: ChartRow | null
    position: 'before' | 'after' | 'child'
  }
  dragElement: HTMLElement | null
  initialTransform: string
}

export function useRowTouchDrag() {
  const touchState = ref<TouchDragState>({
    isDragging: false,
    startY: 0,
    currentY: 0,
    draggedRow: null,
    dropTarget: {
      row: null,
      position: 'before'
    },
    dragElement: null,
    initialTransform: ''
  })

  const resetTouchState = () => {
    if (touchState.value.dragElement) {
      touchState.value.dragElement.style.transform = touchState.value.initialTransform
    }

    touchState.value = {
      isDragging: false,
      startY: 0,
      currentY: 0,
      draggedRow: null,
      dropTarget: {
        row: null,
        position: 'before'
      },
      dragElement: null,
      initialTransform: ''
    }
  }

  const handleTouchStart = (event: TouchEvent, row: ChartRow, element: HTMLElement) => {
    const touch = event.touches[0]
    if (!touch) return

    setTimeout(() => {
      if (touchState.value.isDragging) {
        event.preventDefault()
      }
    }, 100)
    
    touchState.value = {
      isDragging: true,
      startY: touch.clientY,
      currentY: touch.clientY,
      draggedRow: row,
      dropTarget: {
        row: null,
        position: 'before'
      },
      dragElement: element,
      initialTransform: element.style.transform || ''
    }
  }

  const handleTouchMove = (event: TouchEvent, targetRow: ChartRow, rowElement: HTMLElement) => {
    const touch = event.touches[0]
    if (!touch || !touchState.value.isDragging || !touchState.value.dragElement) return

    event.preventDefault()
    touchState.value.currentY = touch.clientY

    const deltaY = touch.clientY - touchState.value.startY
    touchState.value.dragElement.style.transform = `translateY(${deltaY}px)`
    
    const rect = rowElement.getBoundingClientRect()
    const relativeY = touch.clientY - rect.top
    const position = relativeY / rect.height

    if (touchState.value.draggedRow !== targetRow) {
      if (targetRow.children?.length) {
        if (position < 0.25) {
          touchState.value.dropTarget = { row: targetRow, position: 'before' }
        } else if (position > 0.75) {
          touchState.value.dropTarget = { row: targetRow, position: 'after' }
        } else {
          touchState.value.dropTarget = { row: targetRow, position: 'child' }
        }
      } else {
        touchState.value.dropTarget = {
          row: targetRow,
          position: position < 0.5 ? 'before' : 'after'
        }
      }
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (!touchState.value.isDragging) return null

    const touch = event.changedTouches[0]
    if (!touch) return null

    const result = {
      sourceRow: touchState.value.draggedRow,
      dropTarget: touchState.value.dropTarget,
      dropPosition: touchState.value.dropTarget.position
    }

    resetTouchState()
    return result
  }

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetTouchState
  }
}
