<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { ref, computed, inject, reactive, onMounted } from "vue"
import type { CSSProperties } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faArrowDownAZ,
  faArrowDownZA,
  faSort,
  faChevronRight,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Provider
import provideConfig from "../provider/provideConfig"

// Composables
import useDayjsHelper from "../composables/useDayjsHelper"
import { useRowDragAndDrop } from "../composables/useRowDragAndDrop"
import { useColumnTouchResize } from "../composables/useColumnTouchResize"
import { useRowTouchDrag } from "../composables/useRowTouchDrag"

// Types
import type {
  LabelColumnField,
  ChartRow,
  GanttBarObject,
  LabelColumnConfig,
  RowDragEvent
} from "../types"
import type { UseRowsReturn } from "../composables/useRows"

// -----------------------------
// 3. INTERFACES
// -----------------------------

/**
 * Extended row interface with indentation level
 */
export interface LabelColumnRowProps extends ChartRow {
  indentLevel?: number
}

// -----------------------------
// 4. EVENTS
// -----------------------------
const emit = defineEmits<{
  (e: "scroll", value: number): void
  (e: "row-drop", value: RowDragEvent): void
}>()

// -----------------------------
// 5. CONTEXT & CONFIGURATION
// -----------------------------

/**
 * Get the row manager from the parent component
 */
const rowManager = inject<UseRowsReturn>("useRows")

if (!rowManager) {
  throw new Error("useRows does not provide ")
}

/**
 * Extract rows and sorting state from row manager
 */
const { rows, sortState, toggleSort } = rowManager

/**
 * Extract props from configuration
 */
const {
  font,
  colors,
  labelColumnTitle,
  labelColumnWidth,
  rowHeight,
  maxRows,
  multiColumnLabel,
  precision,
  barStart,
  barEnd,
  dateFormat,
  rowLabelClass,
  labelResizable,
  enableRowDragAndDrop,
  hideTimeaxis,
  sortable,
  showEventsAxis,
  eventsAxisHeight
} = provideConfig()

/**
 * Initialize dayjs helper for date formatting
 */
const { toDayjs, format } = useDayjsHelper()

// -----------------------------
// 6. STATE MANAGEMENT
// -----------------------------

/**
 * Stores width values for each column
 */
const columnWidths = reactive<Map<string, number>>(new Map())

/**
 * Keeps track of drag and resize states
 */
const isDragging = ref(false)
const dragStartX = ref(0)
const draggedColumn = ref<string | null>(null)

/**
 * Reference to column container element
 */
const labelContainer = ref<HTMLElement | null>(null)

// -----------------------------
// 7. DRAG & DROP MANAGEMENT
// -----------------------------

/**
 * Initialize row drag and drop functionality
 */
const {
  dragState,
  handleDragStart: handleRowDragStart,
  handleDragOver,
  handleDrop
} = useRowDragAndDrop(
  rows,
  computed(() => sortState.value.direction !== "none"),
  rowManager.updateRows,
  (_event, payload) => emit("row-drop", payload)
)

/**
 * Initialize column resize touch support
 */
const { touchState, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } =
  useColumnTouchResize()

/**
 * Initialize row touch drag support
 */
const {
  touchState: rowTouchState,
  handleTouchStart: handleRowTouchStart,
  handleTouchMove: handleRowTouchMove,
  handleTouchEnd: handleRowTouchEnd,
  resetTouchState: resetRowTouchState
} = useRowTouchDrag()

// -----------------------------
// 8. COMPUTED PROPERTIES
// -----------------------------

/**
 * Get columns based on multiColumnLabel configuration
 */
const columns = computed<LabelColumnConfig[]>(() => {
  if (!multiColumnLabel.value?.length || !labelColumnTitle.value) {
    return [{ field: "Label", sortable: sortable.value }]
  }
  const filteredColumns = multiColumnLabel.value.filter((col) => col.field !== "Label")
  const labelColumn = { field: "Label", sortable: sortable.value }
  return [labelColumn, ...filteredColumns]
})

/**
 * Calculate total width of all columns
 */
const totalWidth = computed(() => {
  let total = 0
  columnWidths.forEach((width) => (total += width))
  return total
})

/**
 * Get processed rows with indentation level
 */
const getProcessedRows = computed(() => {
  const processRows = (rows: ChartRow[], level = 0): LabelColumnRowProps[] => {
    return rows.flatMap((row) => {
      const processedRow: LabelColumnRowProps = {
        ...row,
        indentLevel: level
      }

      const isExpanded = row.id ? rowManager.isGroupExpanded(row.id) : false

      if (row.children?.length && isExpanded) {
        return [processedRow, ...processRows(row.children, level + 1)]
      }

      return [processedRow]
    })
  }

  return processRows(rows.value)
})

/**
 * Style for container based on maxRows setting
 */
const labelContainerStyle = computed<CSSProperties>(() => {
  if (maxRows.value === 0) return {}
  const minRows = Math.min(maxRows.value, getProcessedRows.value.length)

  return {
    height: `${minRows * rowHeight.value}px`,
    "overflow-y": "auto"
  }
})

/**
 * Determine if a column is a sortable standard field
 */
const columnSortableStates = computed(() =>
  columns.value.reduce(
    (acc, column) => {
      acc[column.field] = !!(
        column.sortable !== false &&
        (sortable.value || (!sortable.value && column.sortable)) &&
        (isValidColumn(column.field) || column.sortFn)
      )
      return acc
    },
    {} as Record<string, boolean>
  )
)

const headerHeight = computed(() => {
  if (hideTimeaxis.value) return 0
  return showEventsAxis.value ? 80 + (eventsAxisHeight.value || 25) : 80
})

// -----------------------------
// 9. TOUCH HANDLING
// -----------------------------

/**
 * Timing variables for touch interaction
 */
let touchStartTime = 0
const LONG_PRESS_DURATION = 500

/**
 * Handle row touch start
 * @param e - Touch event
 * @param row - Target row
 */
const onRowTouchStart = (e: TouchEvent, row: ChartRow) => {
  if (!enableRowDragAndDrop.value || sortState.value.direction !== "none") return

  touchStartTime = Date.now()
  const element = e.currentTarget as HTMLElement
  handleRowTouchStart(e, row, element)
}

/**
 * Handle row touch move
 * @param e - Touch event
 * @param targetRow - Target row
 */
const onRowTouchMove = (e: TouchEvent, targetRow: ChartRow) => {
  if (!enableRowDragAndDrop.value || sortState.value.direction !== "none") return

  if (Date.now() - touchStartTime < LONG_PRESS_DURATION) {
    resetRowTouchState()
    return
  }

  const rowElement = e.currentTarget as HTMLElement
  handleRowTouchMove(e, targetRow, rowElement)
}

/**
 * Handle row touch end
 * @param e - Touch event
 */
const onRowTouchEnd = (e: TouchEvent) => {
  if (!enableRowDragAndDrop.value || sortState.value.direction !== "none") return

  if (Date.now() - touchStartTime < LONG_PRESS_DURATION) {
    const target = e.target as HTMLElement
    const button = target.closest(".group-toggle-button")
    if (button) {
      const rowElement = target.closest("[data-row-id]") as HTMLElement
      if (rowElement) {
        const rowId = rowElement.dataset.rowId
        if (rowId) {
          rowManager.toggleGroupExpansion(rowId)
        }
      }
    }
    resetRowTouchState()
    return
  }

  const result = handleRowTouchEnd(e)
  if (result && result.sourceRow && result.dropTarget.row) {
    let newIndex = getProcessedRows.value.findIndex((r) => r === result.dropTarget.row)
    if (result.dropTarget.position === "after") {
      newIndex += 1
    }

    const sourceIndex = getProcessedRows.value.findIndex((r) => r === result.sourceRow)
    if (sourceIndex < newIndex) {
      newIndex -= 1
    }

    const payload = {
      sourceRow: result.sourceRow,
      targetRow: result.dropTarget.row,
      newIndex: newIndex,
      parentId: result.dropTarget.position === "child" ? result.dropTarget.row.id : undefined
    }

    const newRows = [...getProcessedRows.value]
    newRows.splice(sourceIndex, 1)
    newRows.splice(newIndex, 0, result.sourceRow)
    rowManager.updateRows(newRows)

    emit("row-drop", payload)
  }
}

/**
 * Handle column touch start for resizing
 * @param e - Touch event
 * @param column - Column to resize
 */
const handleColumnTouchStart = (e: TouchEvent, column: string) => {
  if (!labelResizable) return

  const currentWidth = columnWidths.get(column) || labelColumnWidth.value
  handleTouchStart(e, column, currentWidth)
}

/**
 * Handle column touch move for resizing
 * @param e - Touch event
 */
const handleColumnTouchMove = (e: TouchEvent) => {
  if (!labelResizable) return

  handleTouchMove(e, (column: string, newWidth: number) => {
    columnWidths.set(column, newWidth)
  })
}

// -----------------------------
// 10. UTILITY FUNCTIONS
// -----------------------------

/**
 * Initialize column widths on component mount
 */
const initializeColumnWidths = () => {
  columns.value.forEach((column) => {
    if (!columnWidths.has(column.field)) {
      columnWidths.set(column.field, labelColumnWidth.value)
    }
  })
}

/**
 * Check if a column is a valid standard field
 * @param field - Field name to check
 * @returns Boolean indicating if field is standard
 */
const isValidColumn = (field: string): field is LabelColumnField => {
  return ["Id", "Label", "StartDate", "EndDate", "Duration", "Progress"].includes(field)
}

/**
 * Get icon for sort direction
 * @param field - Field to get icon for
 * @returns Font Awesome icon
 */
const getSortIcon = (field: string) => {
  if (field !== sortState.value.column || sortState.value.direction === "none") {
    return faSort
  }
  return sortState.value.direction === "asc" ? faArrowDownAZ : faArrowDownZA
}

/**
 * Get visible columns for a row (only Label for groups)
 * @param row - Row to get columns for
 * @returns Array of visible columns
 */
const getVisibleColumns = (row: ChartRow) => {
  if (row.children && row.children.length > 0) {
    return [{ field: "Label", sortable: sortable.value }]
  }
  return columns.value
}

/**
 * Get classes for a row
 * @param row - Row to get classes for
 * @returns Array of class names
 */
const rowClasses = (row: LabelColumnRowProps) => {
  const classes = ["g-label-column-row"]
  if (rowLabelClass.value) {
    classes.push(rowLabelClass.value(row))
  }
  if (row.children?.length) {
    classes.push("g-label-column-group")
  }
  return classes
}

/**
 * Get drag classes for a row
 * @param row - Row to get classes for
 * @returns Object of class names
 */
const getDragClasses = (row: ChartRow) => {
  if (!enableRowDragAndDrop.value) return {}

  const isTarget = dragState.value.dropTarget.row === row
  const isDragged = dragState.value.draggedRow === row

  return {
    "g-label-column-row-draggable": true,
    "g-label-column-row-dragging": isDragged,
    "g-label-column-row-drop-target": isTarget,
    [`g-label-column-row-drop-${dragState.value.dropTarget.position}`]: isTarget
  }
}

// Calculate indentation
const INDENT_WIDTH = 24

/**
 * Get style for row content
 * @param row - Row to style
 * @param isLabelColumn - Whether this is the label column
 * @returns Style object
 */
const getRowStyle = (row: LabelColumnRowProps, isLabelColumn: boolean): CSSProperties => {
  if (!isLabelColumn) {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
    }
  }

  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    position: "relative"
  }

  if (!row.children?.length && !row.indentLevel) {
    style.paddingLeft = `${INDENT_WIDTH}px`
  } else if (row.indentLevel) {
    style.paddingLeft = `${row.indentLevel * INDENT_WIDTH}px`
  }

  return style
}

/**
 * Get style for a cell
 * @param isLabelColumn - Whether this is the label column
 * @returns Style object
 */
const getCellStyle = (isLabelColumn: boolean): CSSProperties => {
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    width: "100%"
  }

  if (!isLabelColumn) {
    style.justifyContent = "center"
    style.paddingLeft = "0"
  }

  return style
}

/**
 * Get style for a column
 * @param column - Column to style
 * @param isGroup - Whether this is a group
 * @returns Style object
 */
const getColumnStyle = (column: string, isGroup: boolean): CSSProperties => {
  if (isGroup && column === "Label") {
    return {
      width: "100%",
      minWidth: "100%",
      maxWidth: "100%",
      position: "relative",
      flexShrink: 0,
      flexGrow: 0
    }
  }

  return {
    width: `${columnWidths.get(column) || labelColumnWidth.value}px`,
    minWidth: `${columnWidths.get(column) || labelColumnWidth.value}px`,
    maxWidth: `${columnWidths.get(column) || labelColumnWidth.value}px`,
    position: "relative",
    flexShrink: 0,
    flexGrow: 0
  }
}

/**
 * Get value for a row column
 * @param row - Row to get value from
 * @param column - Column to get value for
 * @param index - Row index
 * @returns Value for column
 */
const getRowValue = (row: ChartRow, column: LabelColumnConfig, index: number) => {
  if (column.valueGetter) {
    return column.valueGetter(row)
  }

  switch (column.field) {
    case "Id":
      return row.id ?? index + 1
    case "Label":
      return row.label
    case "StartDate": {
      if (!row.bars.length) return "-"
      const minDate = row.bars.reduce((min: string, bar: GanttBarObject) => {
        const currentStart = bar[barStart.value]
        return !min || toDayjs(currentStart).isBefore(toDayjs(min)) ? currentStart : min
      }, "")
      return format(minDate, dateFormat.value)
    }
    case "EndDate": {
      if (!row.bars.length) return "-"
      const maxDate = row.bars.reduce((max: string, bar: GanttBarObject) => {
        const currentEnd = bar[barEnd.value]
        return !max || toDayjs(currentEnd).isAfter(toDayjs(max)) ? currentEnd : max
      }, "")
      return format(maxDate, dateFormat.value)
    }
    case "Duration": {
      if (!row.bars.length) return "-"
      const minStart = row.bars.reduce((min: string, bar: GanttBarObject) => {
        const currentStart = bar[barStart.value]
        return !min || toDayjs(currentStart).isBefore(toDayjs(min)) ? currentStart : min
      }, "")
      const maxEnd = row.bars.reduce((max: string, bar: GanttBarObject) => {
        const currentEnd = bar[barEnd.value]
        return !max || toDayjs(currentEnd).isAfter(toDayjs(max)) ? currentEnd : max
      }, "")
      return calculateDuration(minStart, maxEnd)
    }
    case "Progress": {
      if (!row.bars.length) return "-"
      const progressValues = row.bars
        .map((bar) => bar.ganttBarConfig.progress)
        .filter((progress): progress is number => progress !== undefined)

      if (progressValues.length === 0) return "-"

      const averageProgress =
        progressValues.reduce((sum, curr) => sum + curr, 0) / progressValues.length
      return `${Math.round(averageProgress)}%`
    }
    default:
      return ""
  }
}

/**
 * Calculate duration between two dates
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Formatted duration string
 */
const calculateDuration = (startDate: string, endDate: string) => {
  const start = toDayjs(startDate)
  const end = toDayjs(endDate)

  switch (precision.value) {
    case "hour":
      return `${end.diff(start, "hour")}h`
    case "day":
    case "date":
      return `${end.diff(start, "day")}d`
    case "week":
      return `${end.diff(start, "week")}w`
    case "month":
      return `${end.diff(start, "month")}m`
    default:
      return `${end.diff(start, "day")}d`
  }
}

// -----------------------------
// 11. EVENT HANDLERS
// -----------------------------

/**
 * Handle label scroll event
 * @param e - Scroll event
 */
const handleLabelScroll = (e: Event) => {
  const target = e.target as HTMLElement
  emit("scroll", target.scrollTop)
}

/**
 * Handle group toggle
 * @param row - Row to toggle
 * @param event - Mouse event
 */
const handleGroupToggle = (row: ChartRow, event: Event) => {
  event.stopPropagation()
  if (row.id) {
    rowManager.toggleGroupExpansion(row.id)
  }
}

/**
 * Handle column drag start
 * @param e - Mouse event
 * @param column - Column to drag
 */
const handleDragStart = (e: MouseEvent, column: string) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  draggedColumn.value = column
  document.addEventListener("mousemove", handleDrag)
  document.addEventListener("mouseup", handleDragEnd)
}

/**
 * Handle column drag
 * @param e - Mouse event
 */
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value || !draggedColumn.value) return

  const deltaX = e.clientX - dragStartX.value
  const currentWidth = columnWidths.get(draggedColumn.value) || labelColumnWidth.value
  const newWidth = Math.max(50, currentWidth + deltaX)

  columnWidths.set(draggedColumn.value, newWidth)
  dragStartX.value = e.clientX
}

/**
 * Handle column drag end
 */
const handleDragEnd = () => {
  isDragging.value = false
  draggedColumn.value = null
  document.removeEventListener("mousemove", handleDrag)
  document.removeEventListener("mouseup", handleDragEnd)
}

// -----------------------------
// 12. LIFECYCLE HOOKS
// -----------------------------

onMounted(() => {
  initializeColumnWidths()
})

// -----------------------------
// 13. EXPOSE
// -----------------------------

defineExpose({
  setScroll: (value: number) => {
    if (labelContainer.value) {
      labelContainer.value.scrollTop = value
    }
  }
})
</script>

<template>
  <div
    class="g-label-column"
    :style="{
      fontFamily: font,
      color: colors.text,
      minWidth: `100%`,
      flex: `0 0 ${totalWidth}px`,
      borderRight: `1px solid ${colors.gridAndBorder}`
    }"
  >
    <!-- Column Header -->
    <div
      class="g-label-column-header"
      v-if="!hideTimeaxis"
      :style="{
        background: colors.primary,
        borderBottom: `1px solid ${colors.gridAndBorder}`,
        height: `${headerHeight}px`,
        minHeight: `${headerHeight}px`
      }"
    >
      <template v-for="column in columns" :key="column">
        <div
          v-if="isValidColumn(column.field) || column.valueGetter"
          class="g-label-column-header-cell"
          :class="{ sortable: columnSortableStates[column.field] }"
          role="columnheader"
          :style="getColumnStyle(column.field, false)"
        >
          <div
            class="header-content"
            @click="columnSortableStates[column.field] ? toggleSort(column.field) : undefined"
          >
            <span class="text-ellipsis">
              <slot :name="`label-column-title-${column.field.toLowerCase()}`">
                {{ column.field }}
              </slot>
            </span>
            <span v-if="columnSortableStates[column.field]" class="sort-icon">
              <FontAwesomeIcon :icon="getSortIcon(column.field)" />
            </span>
          </div>
          <div
            v-if="labelResizable"
            class="column-resizer"
            @mousedown="(e) => handleDragStart(e, column.field)"
            @touchstart="(e) => handleColumnTouchStart(e, column.field)"
            @touchmove="handleColumnTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchCancel"
            :class="{
              'is-dragging': isDragging && draggedColumn === column.field,
              'is-touch-resizing':
                touchState.isResizing && touchState.currentColumn === column.field
            }"
          ></div>
        </div>
      </template>
    </div>
    <!-- Rows Container -->
    <div
      class="g-label-column-rows"
      :style="labelContainerStyle"
      ref="labelContainer"
      @scroll="handleLabelScroll"
    >
      <div
        v-for="(row, index) in getProcessedRows"
        :key="`${row.id || row.label}_${index}`"
        :data-row-id="row.id"
        :style="{
          background: row.children?.length
            ? colors.rowContainer
            : index % 2 === 0
              ? colors.ternary
              : colors.quartenary,
          height: `${rowHeight}px`,
          borderBottom: `1px solid ${colors.gridAndBorder}`,
          transform:
            rowTouchState.draggedRow === row
              ? `translateY(${rowTouchState.currentY - rowTouchState.startY}px)`
              : undefined,
          zIndex: rowTouchState.draggedRow === row ? 1000 : undefined
        }"
        :class="[
          rowClasses(row),
          getDragClasses(row),
          {
            'is-touch-dragging': rowTouchState.draggedRow === row,
            'is-touch-drop-target': rowTouchState.dropTarget.row === row,
            [`is-touch-drop-${rowTouchState.dropTarget.position}`]:
              rowTouchState.dropTarget.row === row
          }
        ]"
        :draggable="enableRowDragAndDrop"
        @dragstart="handleRowDragStart(row, $event)"
        @dragover="handleDragOver(row, $event)"
        @drop="handleDrop()"
        @touchstart="(e) => onRowTouchStart(e, row)"
        @touchmove="(e) => onRowTouchMove(e, row)"
        @touchend="onRowTouchEnd"
        @touchcancel="resetRowTouchState"
      >
        <div class="g-label-column-row-inner">
          <template v-for="column in getVisibleColumns(row)" :key="column.field">
            <template v-if="isValidColumn(column.field) || column.valueGetter">
              <div
                class="g-label-column-cell"
                :style="getColumnStyle(column.field, Boolean(row.children?.length))"
              >
                <div :style="getCellStyle(column.field === 'Label')">
                  <div :style="getRowStyle(row, column.field === 'Label')" class="cell-content">
                    <button
                      v-if="column.field === 'Label' && row.children && row.children.length > 0"
                      class="group-toggle-button"
                      @click="handleGroupToggle(row, $event)"
                    >
                      <FontAwesomeIcon
                        :icon="
                          row.id && rowManager.isGroupExpanded(row.id)
                            ? faChevronDown
                            : faChevronRight
                        "
                        class="group-icon"
                      />
                    </button>
                    <span class="text-ellipsis-value">
                      <slot
                        v-if="row.children?.length"
                        :name="`label-column-${column.field.toLowerCase()}-group`"
                        :row="row"
                        :value="getRowValue(row, column, index)"
                      >
                        <slot
                          :name="`label-column-${column.field.toLowerCase()}`"
                          :row="row"
                          :value="getRowValue(row, column, index)"
                        >
                          {{ getRowValue(row, column, index) }}
                        </slot>
                      </slot>
                      <slot
                        v-else
                        :name="`label-column-${column.field.toLowerCase()}`"
                        :row="row"
                        :value="getRowValue(row, column, index)"
                      >
                        {{ getRowValue(row, column, index) }}
                      </slot>
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.g-label-column {
  display: flex;
  flex-direction: column;
  color: rgb(64, 64, 64);
  font-variant-numeric: tabular-nums;
  font-size: 0.9em;
  background: white;
  box-sizing: border-box;
  flex-shrink: 0;
}

.g-label-column-header {
  width: 100%;
  height: 80px;
  min-height: 80px;
  overflow: visible;
  display: flex;
  align-items: center;
  overflow: visible;
}

.g-label-column-row-inner {
  display: flex;
  width: 100%;
  min-width: 100%;
  flex-wrap: nowrap;
  align-items: center;
}

.g-label-column-header-cell {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  height: 100%;
  gap: 0.5rem;
  box-sizing: border-box;
  position: relative;
  overflow: visible;
  text-align: center;
}

.g-label-column-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem 0.3rem;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: none;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 4px;
}

.cell-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.text-ellipsis {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.g-label-column-header-cell.sortable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.g-label-column-header-cell.sortable:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.g-label-column-rows {
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.g-label-column-rows::-webkit-scrollbar {
  display: none;
}

.g-label-column-row {
  width: 100%;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  flex-wrap: nowrap;
}

/*.g-label-column-row:last-child {
  border-bottom: 0px !important;
}*/

.sort-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.6;
  font-size: 0.8em;
  transition: opacity 0.2s ease;
}

.sortable:hover .sort-icon {
  opacity: 1;
}

.column-resizer {
  position: absolute;
  right: -1px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
  background: transparent;
}

.column-resizer:hover,
.column-resizer.is-dragging,
.column-resizer.is-touch-resizing {
  background: rgba(0, 0, 0, 0.1);
}

.g-label-column-header-cell:has(.column-resizer.is-touch-resizing) {
  background-color: rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .column-resizer {
    width: 16px;
  }
}

.g-label-column {
  user-select: none;
}

.g-label-column.dragging {
  cursor: col-resize;
}

.g-label-column-group {
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.03);
}

.group-toggle-button {
  flex: 0 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.group-toggle-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.group-icon {
  width: 12px;
  height: 12px;
  transition: transform 0.2s ease;
}

.group-label {
  font-weight: 600;
}

.g-label-column-row-draggable {
  cursor: move;
}

.g-label-column-row-dragging {
  opacity: 0.5;
  background: var(--dragging-background, #f0f0f0) !important;
}

.g-label-column-row-drop-target {
  position: relative;
}

.g-label-column-row-drop-before::before,
.g-label-column-row-drop-after::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--drop-indicator-color, #4a9eff);
  z-index: 1;
}

.g-label-column-row-drop-before::before {
  top: 0;
}

.g-label-column-row-drop-after::after {
  bottom: 0;
}

.g-label-column-row-drop-child {
  background: var(--drop-child-background, rgba(74, 158, 255, 0.1)) !important;
}

.is-touch-dragging {
  opacity: 0.8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

@media (max-width: 768px) {
  .group-toggle-button {
    padding: 12px;
  }
}

.g-label-column-header-cell-ex {
  position: relative;
  flex-grow: 1;
}
</style>
