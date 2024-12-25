<script setup lang="ts">
import { ref, computed } from "vue"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import provideConfig from "../provider/provideConfig"
import dayjs from "dayjs"
import type { GanttMilestone } from "../types"

const props = defineProps<{
  milestone: GanttMilestone
}>()

const { mapTimeToPosition } = useTimePositionMapping()
const { colors } = provideConfig()

const showTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })

const milestoneDate = computed(() => {
  const date = dayjs(props.milestone.date)
  if (!date.hour() && !date.minute()) {
    return date.hour(12).minute(0).format("YYYY-MM-DD HH:mm")
  }
  return props.milestone.date
})

const xPosition = computed(() => {
  return mapTimeToPosition(milestoneDate.value)
})

const handleMouseEnter = (event: MouseEvent) => {
  const element = event.target as HTMLElement
  const rect = element.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left,
    y: rect.top + 10
  }
  showTooltip.value = true
}

const handleMouseLeave = () => {
  showTooltip.value = false
}

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
    <div class="g-gantt-milestone-label" :style="styleConfig.label">
      {{ milestone.name }}
    </div>

    <div class="g-gantt-milestone-marker" :style="styleConfig.marker" />

    <teleport to="body">
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
</style>
