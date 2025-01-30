<script setup lang="ts">
import provideConfig from "../provider/provideConfig"
import useDayjsHelper from "../composables/useDayjsHelper"
import type { TimeaxisData, TimeUnit } from "../types"

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
  enableMinutes
} = provideConfig()

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

const isHighlightedHour = (date: Date) => highlightedHours?.value.includes(date.getHours())

const isHighlightedDay = (date: Date) => {
  return (
    highlightedDaysInWeek?.value.includes(date.getDay()) ||
    highlightedDaysInMonth?.value.includes(date.getDate())
  )
}

const isHighlightedWeek = (date: Date) => highlightedWeek?.value.includes(toDayjs(date).week())

const isHighlightedMonth = (date: Date) => highlightedMonths?.value.includes(date.getMonth())
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
          background: highlightLine(date) ? colors.hoverHighlight : undefined
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
            background: highlightLine(date) ? colors.hoverHighlight : undefined
          }"
      /></template>
    </template>
  </div>
</template>

<style>
.g-grid-container {
  position: absolute;
  top: 0;
  left: 0%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
}

.g-grid-line {
  width: 1px;
  height: 100%;
}

.g-grid-line:first-child {
  border-left: 0px !important;
}
</style>
