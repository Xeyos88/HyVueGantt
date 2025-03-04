<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { toRefs, ref, watch, nextTick } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Provider
import provideConfig from "../provider/provideConfig"

// Types
import type { TimeaxisEvent } from "../types"

// Composables
import useDayjsHelper from "../composables/useDayjsHelper"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  event: TimeaxisEvent | undefined
  modelValue: boolean
  targetElement: HTMLElement | null
}>()

// Destructure props for reactive usage
const { event, targetElement } = toRefs(props)

// Get font configuration from global provider
const { font, colors, dateFormat } = provideConfig()

// Initialize dayjs helper for date formatting
const { format } = useDayjsHelper()

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------
// Track tooltip position
const tooltipTop = ref("0px")
const tooltipLeft = ref("0px")

// -----------------------------
// 5. WATCHERS
// -----------------------------
/**
 * Update tooltip position when event or targetElement changes
 * Positions tooltip above the target element
 */
watch(
  [() => props.event, () => props.targetElement],
  async () => {
    if (!event.value || !targetElement.value) {
      return
    }

    // Wait for next DOM update
    await nextTick()

    const rect = targetElement.value.getBoundingClientRect()
    tooltipTop.value = `${rect.top - 40}px`
    tooltipLeft.value = `${rect.left + rect.width / 2}px`
  },
  { immediate: true }
)

/**
 * Formats a date using configured date format
 * @param date - Date to format
 * @returns Formatted date string
 */
const formatDate = (date: string | Date) => {
  return format(date, dateFormat.value)
}
</script>

<template>
  <teleport to="body">
    <transition name="g-fade" mode="out-in">
      <div
        v-if="modelValue && event"
        class="g-gantt-event-tooltip"
        :style="{
          top: tooltipTop,
          left: tooltipLeft,
          fontFamily: font,
          background: colors.primary,
          color: colors.text
        }"
      >
        <div class="g-gantt-event-tooltip-content">
          <!-- Event title -->
          <div class="g-gantt-event-tooltip-title">{{ event.label }}</div>
          <!-- Event time period -->
          <div class="g-gantt-event-tooltip-time">
            {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
          </div>
          <!-- Event description (if available) -->
          <div v-if="event.description" class="g-gantt-event-tooltip-description">
            {{ event.description }}
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style>
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

.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.2s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}
</style>
