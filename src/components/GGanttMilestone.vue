<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { ref, computed } from "vue"
import dayjs from "dayjs"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------
// Composables
import useTimePositionMapping from "../composables/useTimePositionMapping"

// Provider
import provideConfig from "../provider/provideConfig"

// Types
import type { GanttMilestone } from "../types"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  milestone: GanttMilestone
}>()

// Initialize time position mapping utility
const { mapTimeToPosition } = useTimePositionMapping()

// Get color configuration from provider
const { colors } = provideConfig()

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------
// Tooltip state
const showTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------
/**
 * Normalizes the milestone date to ensure proper positioning
 * If the date has no hour/minute, sets it to noon for better visual placement
 */
const milestoneDate = computed(() => {
  const date = dayjs(props.milestone.date)
  if (!date.hour() && !date.minute()) {
    return date.hour(12).minute(0).format("YYYY-MM-DD HH:mm")
  }
  return props.milestone.date
})

/**
 * Calculates the horizontal position of the milestone based on its date
 */
const xPosition = computed(() => {
  return mapTimeToPosition(milestoneDate.value)
})

/**
 * Computes the style configuration for the milestone
 * Uses custom color if provided, otherwise uses defaults from theme
 */
const styleConfig = computed(() => {
  if (props.milestone.color) {
    return {
      label: {
        background: props.milestone.color,
        color: "#000",
        border: `2px solid ${props.milestone.color}`
      },
      marker: {
        borderLeft: `2px solid ${props.milestone.color}`
      }
    }
  }

  return {
    label: {
      background: colors.value.primary,
      color: colors.value.text,
      border: "none"
    },
    marker: {
      borderLeft: `2px solid ${colors.value.markerCurrentTime}`
    }
  }
})

// -----------------------------
// 6. EVENT HANDLERS
// -----------------------------
/**
 * Shows tooltip on mouse enter
 */
const handleMouseEnter = (event: MouseEvent) => {
  const element = event.target as HTMLElement
  const rect = element.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left,
    y: rect.top + 10
  }
  showTooltip.value = true
}

/**
 * Hides tooltip on mouse leave
 */
const handleMouseLeave = () => {
  showTooltip.value = false
}
</script>

<template>
  <div
    class="g-gantt-milestone"
    :style="{
      left: `${xPosition}px`
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot
      :name="`milestone-${milestone.id}`"
      :milestone="milestone"
      :style-config="styleConfig"
      :position="xPosition"
    >
      <slot
        name="milestone"
        :milestone="milestone"
        :style-config="styleConfig"
        :position="xPosition"
      >
        <div class="g-gantt-milestone-label" :style="styleConfig.label">
          {{ milestone.name }}
        </div>
      </slot>
    </slot>

    <div class="g-gantt-milestone-marker" :style="styleConfig.marker" />

    <teleport to="body">
      <transition name="g-fade" mode="out-in">
        <div
          v-if="showTooltip"
          class="g-gantt-milestone-tooltip"
          :style="{
            top: `${tooltipPosition.y}px`,
            left: `${tooltipPosition.x}px`,
            background: colors.primary,
            color: colors.text
          }"
        >
          <div class="g-gantt-milestone-tooltip-title">{{ milestone.name }}</div>
          <div class="g-gantt-milestone-tooltip-date">{{ milestone.date }}</div>
          <div class="g-gantt-milestone-tooltip-description">{{ milestone.description }}</div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style>
.g-gantt-milestone {
  position: absolute;
  height: 100%;
  display: flex;
  z-index: 5;
  pointer-events: auto;
  flex-direction: column;
  align-items: center;
}

.g-gantt-milestone-marker {
  width: 0px;
  height: calc(100% - 30px);
  display: flex;
  margin-top: 25px;
}

.g-gantt-milestone-label {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: 4px;
  transform: translateY(0);
}

.g-gantt-milestone-tooltip {
  position: fixed;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75em;
  z-index: 1000;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: translateY(-100%);
}

.g-gantt-milestone-tooltip-title {
  font-weight: bold;
}

.g-gantt-milestone-tooltip-date {
  font-size: 0.9em;
  opacity: 0.8;
}

.g-gantt-milestone-tooltip-description {
  font-size: 0.9em;
  line-height: 1.4;
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
