<script setup lang="ts">
import provideGetChartRows from "../provider/provideGetChartRows"
import provideConfig from "../provider/provideConfig"
import { ref, computed } from "vue"
import type { CSSProperties } from "vue"
import type { SortDirection, LabelColumnField, ChartRow, GanttBarObject } from "../types"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faArrowDownAZ, faArrowDownZA } from "@fortawesome/free-solid-svg-icons"
import useDayjsHelper from "../composables/useDayjsHelper"

defineProps<{
  sortDirection?: SortDirection
}>()

const {
  font,
  colors,
  labelColumnTitle,
  rowHeight,
  maxRows,
  multiColumnLabel,
  precision,
  barStart,
  barEnd
} = provideConfig()
const { toDayjs, format } = useDayjsHelper()

const getChartRows = provideGetChartRows()
const allRows = computed(() => getChartRows())
const labelContainer = ref<HTMLElement | null>(null)

const columns = computed<LabelColumnField[]>(() => {
  if (!multiColumnLabel.value?.length || !labelColumnTitle.value) {
    return ["Label"]
  }
  return multiColumnLabel.value
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

const getRowValue = (row: ChartRow, column: LabelColumnField, index: number) => {
  switch (column) {
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
      return format(minDate, 'hh:mm DD/MM/YYYY')
    }
    case "EndDate": {
      if (!row.bars.length) return "-"
      const maxDate = row.bars.reduce((max: string, bar: GanttBarObject) => {
        const currentEnd = bar[barEnd.value]
        return !max || toDayjs(currentEnd).isAfter(toDayjs(max)) ? currentEnd : max
      }, "")
      return format(maxDate, 'hh:mm DD/MM/YYYY')
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

const labelContainerStyle = computed<CSSProperties>(() => {
  if (maxRows.value === 0) return {}
  const minRows = Math.min(maxRows.value, allRows.value.length)

  return {
    height: `${minRows * rowHeight.value}px`,
    "overflow-y": "auto"
  }
})

const emit = defineEmits<{
  (e: "scroll", value: number): void
  (e: "sort"): void
}>()

const handleLabelScroll = (e: Event) => {
  const target = e.target as HTMLElement
  emit("scroll", target.scrollTop)
}

const handleSort = () => {
  emit("sort")
}

defineExpose({
  setScroll: (value: number) => {
    if (labelContainer.value) {
      labelContainer.value.scrollTop = value
    }
  }
})
</script>

<template>
  <div class="g-label-column" :style="{ fontFamily: font, color: colors.text }">
    <slot name="label-column-title">
      <div class="g-label-column-header" :style="{ background: colors.primary }">
        <div
          v-for="column in columns"
          :key="column"
          class="g-label-column-header-cell"
          @click="column === 'Label' ? handleSort() : undefined"
          :class="{ sortable: column === 'Label' }"
          role="columnheader"
        >
          {{ column }}
          <span v-if="column === 'Label' && sortDirection === 'asc'" class="sort-icon">
            <FontAwesomeIcon :icon="faArrowDownAZ" />
          </span>
          <span v-if="column === 'Label' && sortDirection === 'desc'" class="sort-icon">
            <FontAwesomeIcon :icon="faArrowDownZA" />
          </span>
        </div>
      </div>
    </slot>
    <div
      class="g-label-column-rows"
      :style="labelContainerStyle"
      ref="labelContainer"
      @scroll="handleLabelScroll"
    >
      <div
        v-for="(row, index) in allRows"
        :key="`${row.id || row.label}_${index}`"
        class="g-label-column-row"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          height: `${rowHeight}px`
        }"
      >
        <template v-for="column in columns" :key="column">
          <slot
            :name="`label-column-${column.toLowerCase()}`"
            :row="row"
            :value="getRowValue(row, column, index)"
          >
            <div class="g-label-column-cell">
              {{ getRowValue(row, column, index) }}
            </div>
          </slot>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
.g-label-column {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: rgb(64, 64, 64);
  font-variant-numeric: tabular-nums;
  font-size: 0.9em;
}

.g-label-column-header {
  width: 100%;
  height: 80px;
  min-height: 80px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.g-label-column-header-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  height: 100%;
}

.g-label-column-header-cell.sortable {
  cursor: pointer;
}

.g-label-column-rows {
  width: 100%;
  height: 100%;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.g-label-column-rows::-webkit-scrollbar {
  display: none;
}

.g-label-column-row {
  width: 100%;
  display: flex;
  box-sizing: border-box;
  align-items: center;
}

.g-label-column-cell {
  flex: 1;
  padding: 0.1rem 0.3rem;
  overflow: hidden;
  white-space: normal;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-icon {
  margin-left: 0.25rem;
}
</style>
