<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Provider
import provideConfig from "../provider/provideConfig"

// Composables
import useDayjsHelper from "../composables/useDayjsHelper"

// Types
import type { TimeaxisData, TimeUnit } from "../types"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  timeaxisUnits: TimeaxisData
  internalPrecision: TimeUnit
}>()

const { toDayjs } = useDayjsHelper()

const {
  colors,
  highlightedHours,
  highlightedDaysInWeek,
  highlightedDaysInMonth,
  highlightedMonths,
  highlightedWeek,
  highlightedDateRanges,
  enableMinutes
} = provideConfig()

// -----------------------------
// 4. HELPER FUNCTIONS
// -----------------------------

/**
 * Determines if a grid line should be highlighted based on date and precision
 */
const highlightLine = (date: Date) => {
  if (props.internalPrecision === "hour") {
    return (
      isHighlightedHour(date) ||
      isHighlightedDay(date) ||
      isHighlightedMonth(date) ||
      isHighlightedWeek(date)
    )
  }

  if (props.internalPrecision === "day" || props.internalPrecision === "date") {
    return isHighlightedDay(date) || isHighlightedMonth(date) || isHighlightedWeek(date)
  }

  if (props.internalPrecision === "week") {
    return isHighlightedWeek(date) || isHighlightedMonth(date)
  }

  if (props.internalPrecision === "month") {
    return isHighlightedMonth(date)
  }

  return false
}

/**
 * Checks if the hour of a date is in the highlighted hours list
 */
const isHighlightedHour = (date: Date) => highlightedHours?.value.includes(date.getHours())

/**
 * Checks if the day of a date is in either the highlighted days of week or month lists
 */
const isHighlightedDay = (date: Date) => {
  return (
    highlightedDaysInWeek?.value.includes(date.getDay()) ||
    highlightedDaysInMonth?.value.includes(date.getDate())
  )
}

/**
 * Checks if the week of a date is in the highlighted weeks list
 */
const isHighlightedWeek = (date: Date) => highlightedWeek?.value.includes(toDayjs(date).week())

/**
 * Checks if the month of a date is in the highlighted months list
 */
const isHighlightedMonth = (date: Date) => highlightedMonths?.value.includes(date.getMonth())

/**
 * Returns the highlight color if a cell interval overlaps any highlighted date range.
 * @param {Date} date - The start date of the grid cell
 * @param {number} cellDurationMs - The duration of the cell in milliseconds
 * @returns {string | undefined} The color if highlighted, undefined otherwise
 */
const getDateRangeHighlightColor = (date: Date, cellDurationMs: number): string | undefined => {
  if (!highlightedDateRanges?.value?.length) return undefined
  if (props.internalPrecision !== "hour") return undefined
  const cellStartMs = date.getTime()
  const cellEndMs = cellStartMs + cellDurationMs
  for (const range of highlightedDateRanges.value) {
    const startMs =
      range.start instanceof Date ? range.start.getTime() : new Date(range.start).getTime()
    const endMs =
      range.end instanceof Date ? range.end.getTime() : new Date(range.end).getTime()
    if (cellStartMs < endMs && cellEndMs > startMs) {
      return range.color || colors.value.hoverHighlight
    }
  }
  return undefined
}
</script>

<template>
  <div class="g-grid-container" ref="time">
    <template v-if="!enableMinutes">
      <div
        v-for="({ label, date, width }, index) in timeaxisUnits.result.lowerUnits"
        :key="`${label}_${index}`"
        class="g-grid-line"
        :style="{
          width,
          borderLeft: `1px solid ${colors.gridAndBorder}`,
          background: highlightLine(date)
            ? colors.hoverHighlight
            : getDateRangeHighlightColor(
                date,
                (timeaxisUnits.result.lowerUnits[index + 1]?.date ?? date).getTime() - date.getTime()
                  || (index > 0 ? date.getTime() - timeaxisUnits.result.lowerUnits[index - 1]!.date.getTime() : 3600000)
              )
        }"
      />
    </template>
    <template v-else>
      <template
        v-for="({ label, date, width }, index) in timeaxisUnits.result.lowerUnits"
        :key="`${label}_${index}`"
      >
        <div
          v-for="step in timeaxisUnits.globalMinuteStep"
          :key="`${date}-${step}`"
          :class="step"
          class="g-grid-line step"
          :style="{
            width,
            borderLeft: `1px solid ${colors.gridAndBorder}`,
            background: highlightLine(date)
              ? colors.hoverHighlight
              : getDateRangeHighlightColor(
                  date,
                  (timeaxisUnits.result.lowerUnits[index + 1]?.date ?? date).getTime() - date.getTime()
                    || (index > 0 ? date.getTime() - timeaxisUnits.result.lowerUnits[index - 1]!.date.getTime() : 3600000)
                )
          }"
      /></template>
    </template>
  </div>
</template>

<style>
.g-grid-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
}

.g-grid-line {
  width: 1px;
  height: 100%;
  box-sizing: border-box;
}

.g-grid-line:first-child {
  border-left: 0px !important;
}
</style>
