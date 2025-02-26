import { ref, type Ref } from "vue"
import type { ChartRow } from "../types"

/**
 * Type Drop position
 */
type DropPosition = "before" | "after" | "child"

/**
 * Target release state
 */
interface DropTarget {
  row: ChartRow | null
  position: DropPosition
}

/**
 * Result of the drag and drop operation
 */
interface DragResult {
  sourceRow: ChartRow | null
  dropTarget: DropTarget
  dropPosition: DropPosition
}

/**
 * Complete state of the touch drag operation
 */
export interface TouchDragState {
  isDragging: boolean
  startY: number
  currentY: number
  draggedRow: ChartRow | null
  dropTarget: DropTarget
  dragElement: HTMLElement | null
  initialTransform: string
}

/**
 * Return type del composable
 */
interface RowTouchDragReturn {
  touchState: Ref<TouchDragState>
  handleTouchStart: (event: TouchEvent, row: ChartRow, element: HTMLElement) => void
  handleTouchMove: (event: TouchEvent, targetRow: ChartRow, rowElement: HTMLElement) => void
  handleTouchEnd: (event: TouchEvent) => DragResult | null
  resetTouchState: () => void
}

/**
 * A composable that manages touch-based drag and drop functionality for rows
 * Handles touch events, visual feedback, and drop position detection
 * @returns Object containing touch state and event handlers
 */
export function useRowTouchDrag(): RowTouchDragReturn {
  const touchState = ref<TouchDragState>({
    isDragging: false,
    startY: 0,
    currentY: 0,
    draggedRow: null,
    dropTarget: {
      row: null,
      position: "before"
    },
    dragElement: null,
    initialTransform: ""
  })

  /**
   * Resets touch drag state and restores original element position
   * Called when drag operation ends or is cancelled
   */
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
        position: "before"
      },
      dragElement: null,
      initialTransform: ""
    }
  }

  /**
   * Initializes touch drag operation
   * Sets up initial positions and state for dragging
   * @param event - Touch event that started the drag
   * @param row - Row being dragged
   * @param element - DOM element being dragged
   */
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
        position: "before"
      },
      dragElement: element,
      initialTransform: element.style.transform || ""
    }
  }

  /**
   * Handles ongoing touch drag movement
   * Updates visual position and calculates drop targets
   * @param event - Touch move event
   * @param targetRow - Row being dragged over
   * @param rowElement - DOM element being dragged over
   */
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
          touchState.value.dropTarget = { row: targetRow, position: "before" }
        } else if (position > 0.75) {
          touchState.value.dropTarget = { row: targetRow, position: "after" }
        } else {
          touchState.value.dropTarget = { row: targetRow, position: "child" }
        }
      } else {
        touchState.value.dropTarget = {
          row: targetRow,
          position: position < 0.5 ? "before" : "after"
        }
      }
    }
  }

  /**
   * Finalizes touch drag operation
   * Determines final drop position and triggers updates
   * @param event - Touch end event
   * @returns Object containing drag result information or null if invalid
   */
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
