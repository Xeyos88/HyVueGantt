<script setup lang="ts">
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import { ref, computed, inject, reactive, onMounted } from "vue"
import type { CSSProperties } from "vue"
import type { LabelColumnField, ChartRow, GanttBarObject, LabelColumnConfig } from "../types"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faArrowDownAZ, faArrowDownZA, faSort } from "@fortawesome/free-solid-svg-icons"
import useDayjsHelper from "../composables/useDayjsHelper"
import type { UseRowsReturn } from "../composables/useRows"

const rowManager = inject<UseRowsReturn>("useRows")
if (!rowManager) {
  throw new Error("useRows does not provide ")
}

const { rows, sortState, toggleSort } = rowManager
const { sortable, labelResizable } = provideBooleanConfig()
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
  dateFormat
} = provideConfig()

const { toDayjs, format } = useDayjsHelper()

const columnWidths = reactive<Map<string, number>>(new Map())
const isDragging = ref(false)
const dragStartX = ref(0)
const draggedColumn = ref<string | null>(null)

const initializeColumnWidths = () => {
  columns.value.forEach((column) => {
    if (!columnWidths.has(column.field)) {
      columnWidths.set(column.field, labelColumnWidth.value)
    }
  })
}

const columns = computed<LabelColumnConfig[]>(() => {
  if (!multiColumnLabel.value?.length || !labelColumnTitle.value) {
    return [{ field: "Label", sortable: true }]
  }
  return multiColumnLabel.value
})

const totalWidth = computed(() => {
  let total = 0
  columnWidths.forEach((width) => (total += width))
  return total
})

const handleDragStart = (e: MouseEvent, column: string) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  draggedColumn.value = column
  document.addEventListener("mousemove", handleDrag)
  document.addEventListener("mouseup", handleDragEnd)
}

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value || !draggedColumn.value) return

  const deltaX = e.clientX - dragStartX.value
  const currentWidth = columnWidths.get(draggedColumn.value) || labelColumnWidth.value
  const newWidth = Math.max(50, currentWidth + deltaX)

  columnWidths.set(draggedColumn.value, newWidth)
  dragStartX.value = e.clientX
}

const handleDragEnd = () => {
  isDragging.value = false
  draggedColumn.value = null
  document.removeEventListener("mousemove", handleDrag)
  document.removeEventListener("mouseup", handleDragEnd)
}

const getColumnStyle = (column: string): CSSProperties => ({
  width: `${columnWidths.get(column) || labelColumnWidth.value}px`,
  minWidth: `${columnWidths.get(column) || labelColumnWidth.value}px`,
  maxWidth: `${columnWidths.get(column) || labelColumnWidth.value}px`,
  position: "relative",
  flexShrink: 0,
  flexGrow: 0
})

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
    default:
      return ""
  }
}

const labelContainer = ref<HTMLElement | null>(null)

const labelContainerStyle = computed<CSSProperties>(() => {
  console.log(maxRows.value, rows.value.length)
  if (maxRows.value === 0) return {}
  const minRows = Math.min(maxRows.value, rows.value.length)

  return {
    height: `${minRows * rowHeight.value}px`,
    "overflow-y": "auto"
  }
})

const getSortIcon = (field: string) => {
  if (field !== sortState.value.column || sortState.value.direction === "none") {
    return faSort
  }
  return sortState.value.direction === "asc" ? faArrowDownAZ : faArrowDownZA
}

const isValidColumn = (field: string): field is LabelColumnField => {
  return ["Id", "Label", "StartDate", "EndDate", "Duration"].includes(field)
}

const isSortable = (column: LabelColumnConfig) => {
  if (column.sortable === false) return false
  return (
    (sortable || (!sortable && column.sortable)) && (isValidColumn(column.field) || column.sortFn)
  )
}

const emit = defineEmits<{
  (e: "scroll", value: number): void
}>()

const handleLabelScroll = (e: Event) => {
  const target = e.target as HTMLElement
  emit("scroll", target.scrollTop)
}

onMounted(() => {
  initializeColumnWidths()
})

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
      width: `${totalWidth}px`,
      minWidth: `${totalWidth}px`,
      flex: `0 0 ${totalWidth}px`
    }"
  >
    <slot name="label-column-title">
      <div class="g-label-column-header" :style="{ background: colors.primary }">
        <template v-for="column in columns" :key="column">
          <div
            v-if="isValidColumn(column.field) || column.valueGetter"
            class="g-label-column-header-cell"
            :class="{ sortable: isSortable(column) }"
            role="columnheader"
            :style="getColumnStyle(column.field)"
          >
            <div
              class="header-content"
              @click="isSortable(column) ? toggleSort(column.field) : undefined"
            >
              <span class="text-ellipsis">{{ column.field }}</span>
              <span v-if="isSortable(column)" class="sort-icon">
                <FontAwesomeIcon :icon="getSortIcon(column.field)" />
              </span>
            </div>
            <div
              v-if="labelResizable"
              class="column-resizer"
              @mousedown="(e) => handleDragStart(e, column.field)"
              :class="{ 'is-dragging': isDragging && draggedColumn === column.field }"
            ></div>
          </div>
        </template>
      </div>
    </slot>
    <div
      class="g-label-column-rows"
      :style="labelContainerStyle"
      ref="labelContainer"
      @scroll="handleLabelScroll"
    >
      <div
        v-for="(row, index) in rows"
        :key="`${row.id || row.label}_${index}`"
        class="g-label-column-row"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          height: `${rowHeight}px`
        }"
      >
        <div class="g-label-column-row-inner">
          <template v-for="column in columns" :key="column.field">
            <template v-if="isValidColumn(column.field) || column.valueGetter">
              <slot
                :name="`label-column-${column.field.toLowerCase()}`"
                :row="row"
                :value="getRowValue(row, column, index)"
              >
                <div class="g-label-column-cell" :style="getColumnStyle(column.field)">
                  <div class="cell-content">
                    <span class="text-ellipsis">
                      {{ getRowValue(row, column, index) }}
                    </span>
                  </div>
                </div>
              </slot>
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

.header-content,
.cell-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 4px;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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
.column-resizer.is-dragging {
  background: rgba(0, 0, 0, 0.1);
}

.g-label-column-header-cell {
  position: relative;
  overflow: visible;
}

.g-label-column {
  user-select: none;
}

.g-label-column.dragging {
  cursor: col-resize;
}
</style>
