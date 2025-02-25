<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { computed, toRefs, ref, watch, nextTick } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Types
import type { GanttBarObject } from "../types"

// Composables
import useDayjsHelper from "../composables/useDayjsHelper"
import provideConfig from "../provider/provideConfig"

// -----------------------------
// 3. CONSTANTS
// -----------------------------

/**
 * Date format templates for different precision levels
 */
const TOOLTIP_FORMATS = {
  hour: "HH:mm",
  day: "DD. MMM HH:mm",
  date: "DD. MMMM YYYY",
  month: "DD. MMMM YYYY",
  week: "DD. MMMM YYYY (WW)"
} as const

/**
 * Default color for tooltip dot when bar color is not available
 */
const DEFAULT_DOT_COLOR = "cadetblue"

// -----------------------------
// 4. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  bar: GanttBarObject | undefined
  modelValue: boolean
}>()

// -----------------------------
// 5. INTERNAL STATE
// -----------------------------
const { bar } = toRefs(props)
const { precision, font, barStart, barEnd, rowHeight, milestones } = provideConfig()

// Position state for tooltip
const tooltipTop = ref("0px")
const tooltipLeft = ref("0px")

// -----------------------------
// 6. LIFECYCLE HOOKS
// -----------------------------

/**
 * Watch for bar changes to update tooltip position
 */
watch(
  () => props.bar,
  async () => {
    await nextTick()

    const barId = bar?.value?.ganttBarConfig.id || ""
    if (!barId) {
      return
    }

    // Get bar element position and set tooltip position
    const barElement = document.getElementById(barId)
    const { top, left } = barElement?.getBoundingClientRect() || {
      top: 0,
      left: 0
    }
    const leftValue = Math.max(left, 10)
    tooltipTop.value = `${top + rowHeight.value - 10}px`
    tooltipLeft.value = `${leftValue}px`
  },
  { deep: true, immediate: true }
)

// -----------------------------
// 7. COMPUTED PROPERTIES
// -----------------------------

/**
 * Get color for tooltip dot from bar style
 */
const dotColor = computed(() => bar?.value?.ganttBarConfig.style?.background || DEFAULT_DOT_COLOR)

/**
 * Initialize dayjs helper for date formatting
 */
const { toDayjs } = useDayjsHelper()

/**
 * Raw start date value from bar
 */
const barStartRaw = computed(() => bar.value?.[barStart.value])

/**
 * Raw end date value from bar
 */
const barEndRaw = computed(() => bar.value?.[barEnd.value])

/**
 * Computed tooltip content with formatted dates
 */
const tooltipContent = computed(() => {
  if (!bar?.value) {
    return ""
  }

  // Check if bar is associated with a milestone
  const milestone = milestones.value.find((m) => m.id === bar.value?.ganttBarConfig.milestoneId)

  // Format dates based on chart precision
  const format = TOOLTIP_FORMATS[precision.value]
  const barStartFormatted = toDayjs(barStartRaw.value).format(format)
  const barEndFormatted = toDayjs(barEndRaw.value).format(format)

  // Add milestone name if present
  const milestoneName = milestone ? ` - (${milestone.name})` : ""

  return `${barStartFormatted} \u2013 ${barEndFormatted}${milestoneName}`
})
</script>

<template>
  <teleport to="body">
    <!-- Animated transition for tooltip -->
    <transition name="g-fade" mode="out-in">
      <div
        v-if="modelValue"
        class="g-gantt-tooltip"
        :style="{
          top: tooltipTop,
          left: tooltipLeft,
          fontFamily: font
        }"
      >
        <!-- Color indicator dot -->
        <div class="g-gantt-tooltip-color-dot" :style="{ background: dotColor }" />

        <!-- Tooltip content with slot support -->
        <slot :bar="bar" :bar-start="barStartRaw" :bar-end="barEndRaw">
          {{ tooltipContent }}
        </slot>
      </div>
    </transition>
  </teleport>
</template>

<style>
.g-gantt-tooltip {
  position: fixed;
  background: black;
  color: white;
  z-index: 4;
  font-size: 0.85em;
  padding: 5px;
  border-radius: 3px;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
}

.g-gantt-tooltip:before {
  content: "";
  position: absolute;
  top: 0;
  left: 10%;
  width: 0;
  height: 0;
  border: 10px solid transparent;
  border-bottom-color: black;
  border-top: 0;
  margin-left: -5px;
  margin-top: -5px;
}

.g-gantt-tooltip-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 100%;
  margin-right: 4px;
}

.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.3s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}
</style>
