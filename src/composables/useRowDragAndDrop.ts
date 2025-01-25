import { ref, type Ref } from "vue"
import type { ChartRow, RowDragEvent } from "../types"

/**
 * Interface defining the drag state for row operations
 */
interface DragState {
  isDragging: boolean
  draggedRow: ChartRow | null
  dropTarget: {
    row: ChartRow | null
    position: "before" | "after" | "child"
  }
}

/**
 * A composable that manages row drag and drop functionality in the Gantt chart
 * Handles row reordering, hierarchical grouping, and drag & drop validation
 *
 * @param rows - Ref containing the array of chart rows
 * @param isSorted - Ref indicating if rows are currently sorted
 * @param updateRows - Function to update the rows array
 * @param emit - Function to emit drag and drop events
 * @returns Object containing drag state and handlers
 */
export function useRowDragAndDrop(
  rows: Ref<ChartRow[]>,
  isSorted: Ref<boolean>,
  updateRows: (rows: ChartRow[]) => void,
  emit: (event: "row-drop", payload: RowDragEvent) => void
) {
  const dragState = ref<DragState>({
    isDragging: false,
    draggedRow: null,
    dropTarget: {
      row: null,
      position: "before"
    }
  })

  const originalOrder = ref<Map<string | number, number>>(new Map())

  /**
   * Validates if a drop operation is allowed between two rows
   * Prevents invalid parent-child relationships
   * @param source - Source row being dragged
   * @param target - Target row being dropped onto
   * @returns Boolean indicating if drop is valid
   */
  const isValidDrop = (source: ChartRow, target: ChartRow): boolean => {
    const isParentOfTarget = (row: ChartRow): boolean => {
      if (!row.children?.length) return false
      return row.children.some((child) => child === target || isParentOfTarget(child))
    }
    return !isParentOfTarget(source)
  }

  /**
   * Handles the start of a drag operation
   * Initializes drag state and sets up the drag operation
   * @param row - Row being dragged
   * @param event - Drag start event
   */
  const handleDragStart = (row: ChartRow, event: DragEvent) => {
    if (isSorted.value) return

    dragState.value.isDragging = true
    dragState.value.draggedRow = row

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", "")
    }

    if (originalOrder.value.size === 0) {
      rows.value.forEach((row, index) => {
        if (row.id) {
          originalOrder.value.set(row.id, index)
        }
      })
    }
  }

  /**
   * Handles drag over events during row dragging
   * Updates drop target and position indicators
   * @param row - Row being dragged over
   * @param event - Drag over event
   */
  const handleDragOver = (row: ChartRow, event: DragEvent) => {
    if (!dragState.value.draggedRow || !isValidDrop(dragState.value.draggedRow, row)) {
      return
    }

    event.preventDefault()
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseY = event.clientY - rect.top

    if (row.children?.length) {
      if (mouseY < rect.height * 0.25) {
        dragState.value.dropTarget = { row, position: "before" }
      } else if (mouseY > rect.height * 0.75) {
        dragState.value.dropTarget = { row, position: "after" }
      } else {
        dragState.value.dropTarget = { row, position: "child" }
      }
    } else {
      dragState.value.dropTarget = {
        row,
        position: mouseY < rect.height / 2 ? "before" : "after"
      }
    }
  }

  const isDescendant = (parent: ChartRow, potentialChild: ChartRow): boolean => {
    if (!parent.children) {
      return false
    }

    return parent.children.some(
      (child) => child.id === potentialChild.id || isDescendant(child, potentialChild)
    )
  }

  const findRowIndexById = (rows: ChartRow[], id: string | number): [number, ChartRow[]] => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]!.id === id) {
        return [i, rows]
      }
      if (rows[i]!.children?.length) {
        const [index, parentRows] = findRowIndexById(rows[i]!.children!, id)
        if (index !== -1) {
          return [index, parentRows]
        }
      }
    }
    return [-1, rows]
  }

  /**
   * Handles the completion of a drag operation
   * Updates row positions and emits drop event
   */
  const handleDrop = () => {
    const { draggedRow, dropTarget } = dragState.value
    if (!draggedRow || !dropTarget.row || isSorted.value || draggedRow === dropTarget.row) {
      return
    }

    if (isDescendant(draggedRow, dropTarget.row)) {
      return
    }

    const [sourceIndex, sourceParentRows] = findRowIndexById(rows.value, draggedRow.id!)
    const [targetIndex, targetParentRows] = findRowIndexById(rows.value, dropTarget.row.id!)

    if (sourceIndex === -1 || targetIndex === -1) {
      return
    }

    const [removed] = sourceParentRows.splice(sourceIndex, 1)

    const insertIndex = dropTarget.position === "after" ? targetIndex + 1 : targetIndex

    targetParentRows.splice(insertIndex, 0, removed!)

    updateRows([...rows.value])

    emit("row-drop", {
      sourceRow: draggedRow,
      targetRow: dropTarget.row,
      newIndex: insertIndex,
      parentId: targetParentRows === rows.value ? undefined : dropTarget.row.id
    })

    dragState.value = {
      isDragging: false,
      draggedRow: null,
      dropTarget: { row: null, position: "before" }
    }
  }

  /**
   * Resets rows to their original order
   * Used when clearing sort or custom ordering
   */
  const resetOrder = () => {
    if (originalOrder.value.size === 0) return

    rows.value.sort((a, b) => {
      const aIndex = a.id ? (originalOrder.value.get(a.id) ?? 0) : 0
      const bIndex = b.id ? (originalOrder.value.get(b.id) ?? 0) : 0
      return aIndex - bIndex
    })
  }

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    resetOrder,
    isDescendant,
    findRowIndexById
  }
}
