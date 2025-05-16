<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { computed, toRefs, ref, watch, nextTick } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Types
import type { GanttBarObject, TimeaxisEvent, TimeaxisUnit } from "../types"

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
  // Common props
  modelValue: boolean
  type: "bar" | "event" | "holiday"

  // Type-specific props
  bar?: GanttBarObject
  event?: TimeaxisEvent
  unit?: TimeaxisUnit
  targetElement?: HTMLElement | null
}>()

// -----------------------------
// 5. INTERNAL STATE
// -----------------------------
const { bar, event, unit, targetElement, type } = toRefs(props)
const { precision, font, barStart, barEnd, rowHeight, milestones, colors, dateFormat } =
  provideConfig()

// Position state for tooltip
const tooltipTop = ref("0px")
const tooltipLeft = ref("0px")

// DayJS helper
const { toDayjs, format } = useDayjsHelper()

// -----------------------------
// 6. LIFECYCLE HOOKS
// -----------------------------

/**
 * Watch for target changes to update tooltip position
 */
watch(
  [
    () => props.bar,
    () => props.event,
    () => props.unit,
    () => props.targetElement,
    () => props.type
  ],
  async () => {
    await nextTick()

    if (type.value === "bar" && bar.value) {
      const barId = bar.value.ganttBarConfig.id || ""
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
    } else if (type.value === "event" && event.value && targetElement.value) {
      const rect = targetElement.value.getBoundingClientRect()
      tooltipTop.value = `${rect.top - 95}px`
      tooltipLeft.value = `${rect.left + rect.width / 2}px`
    } else if (type.value === "holiday" && unit.value?.holidayName && targetElement.value) {
      const rect = targetElement.value.getBoundingClientRect()
      tooltipTop.value = `${rect.top - 30}px`
      tooltipLeft.value = `${rect.left + rect.width / 2}px`
    }
  },
  { deep: true, immediate: true }
)

// -----------------------------
// 7. COMPUTED PROPERTIES
// -----------------------------

/**
 * Get color for tooltip dot from bar style
 */
const dotColor = computed(() => bar.value?.ganttBarConfig.style?.background || DEFAULT_DOT_COLOR)

/**
 * Raw start date value from bar
 */
const barStartRaw = computed(() => bar.value?.[barStart.value])

/**
 * Raw end date value from bar
 */
const barEndRaw = computed(() => bar.value?.[barEnd.value])

/**
 * Computed tooltip content with formatted dates for bar type
 */
const tooltipContent = computed(() => {
  if (!bar.value) {
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

/**
 * Formats a date using configured date format
 * @param date - Date to format
 * @returns Formatted date string
 */
const formatDate = (date: string | Date) => {
  return format(date, dateFormat.value)
}

// Compute CSS classes based on tooltip type
const tooltipClass = computed(() => {
  switch (type.value) {
    case "bar":
      return "g-gantt-tooltip"
    case "event":
      return "g-gantt-event-tooltip"
    case "holiday":
      return "g-gantt-holiday-tooltip"
    default:
      return "g-gantt-tooltip"
  }
})

// Compute style based on tooltip type
const tooltipStyle = computed(() => {
  const baseStyle = {
    top: tooltipTop.value,
    left: tooltipLeft.value,
    fontFamily: font.value
  }

  switch (type.value) {
    case "bar":
      return baseStyle
    case "event":
      return {
        ...baseStyle,
        background: colors.value.primary,
        color: colors.value.text
      }
    case "holiday":
      return baseStyle
    default:
      return baseStyle
  }
})
</script>

<template>
  <teleport to="body">
    <!-- Animated transition for tooltip -->
    <transition name="g-fade" mode="out-in">
      <!-- Bar Tooltip -->
      <div v-if="modelValue && type === 'bar' && bar" :class="tooltipClass" :style="tooltipStyle">
        <!-- Color indicator dot -->
        <div class="g-gantt-tooltip-color-dot" :style="{ background: dotColor }" />

        <!-- Tooltip content with slot support -->
        <slot :bar="bar" :bar-start="barStartRaw" :bar-end="barEndRaw">
          {{ tooltipContent }}
        </slot>
      </div>

      <!-- Event Tooltip -->
      <div
        v-else-if="modelValue && type === 'event' && event"
        :class="tooltipClass"
        :style="tooltipStyle"
      >
        <!-- Tooltip content with slot support -->
        <slot name="event-tooltip" :event="event" :format-date="formatDate">
          <div class="g-gantt-event-tooltip-content">
            <div class="g-gantt-event-tooltip-title">{{ event.label }}</div>
            <div class="g-gantt-event-tooltip-time">
              {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
            </div>
            <div v-if="event.description" class="g-gantt-event-tooltip-description">
              {{ event.description }}
            </div>
          </div>
        </slot>
      </div>

      <!-- Holiday Tooltip -->
      <div
        v-else-if="modelValue && type === 'holiday' && unit?.holidayName"
        :class="tooltipClass"
        :style="tooltipStyle"
      >
        <!-- Tooltip content with slot support -->
        <slot name="holiday-tooltip" :unit="unit">
          <div class="g-gantt-holiday-tooltip-content">
            {{ unit.holidayName }}
          </div>
        </slot>
      </div>
    </transition>
  </teleport>
</template>

<style>
/* Bar Tooltip Styles */
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

/* Event Tooltip Styles */
.g-gantt-event-tooltip {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  max-width: 280px;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.g-gantt-event-tooltip:after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--tooltip-background, #2a2f42);
}

.g-gantt-event-tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.g-gantt-event-tooltip-time {
  font-size: 11px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.g-gantt-event-tooltip-description {
  font-size: 11px;
  line-height: 1.4;
  opacity: 0.9;
  margin-top: 4px;
  white-space: normal;
  word-break: break-word;
}

/* Holiday Tooltip Styles */
.g-gantt-holiday-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  transform: translateX(-50%);
  white-space: nowrap;
}

.g-gantt-holiday-tooltip:after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(0, 0, 0, 0.8);
}

/* Transition Animations */
.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.3s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}
</style>
