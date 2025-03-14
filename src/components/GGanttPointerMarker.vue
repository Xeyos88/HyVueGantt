<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { ref, computed, inject, useTemplateRef } from "vue"
import { computedWithControl, useElementBounding, useMouseInElement, watchThrottled } from "@vueuse/core"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Composables
import type { UseRowsReturn } from "../composables/useRows"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import useDayjsHelper from "../composables/useDayjsHelper"

// Types and Constants
import type { GanttBarObject } from "../types"
import { CHART_AREA_KEY, CHART_WRAPPER_KEY } from "../provider/symbols"

// Providers
import provideConfig from "../provider/provideConfig"

// -----------------------------
// 3. INTERNAL STATE
// -----------------------------

// Component Refs
const chartAreaEl = inject(CHART_AREA_KEY)
const chartWrapperEl = inject(CHART_WRAPPER_KEY)
const hitBars = ref<GanttBarObject[]>([])
const tooltipContainer = useTemplateRef('tooltip')

// -----------------------------
// 4. COMPOSABLES & PROVIDERS
// -----------------------------

const { colors, barStart, barEnd } = provideConfig()
const { mapPositionToTime } = useTimePositionMapping()
const rowManager = inject<UseRowsReturn>("useRows")!
const { toDayjs } = useDayjsHelper()

// Mouse / pointer tracker
const { elementX } = useMouseInElement(chartAreaEl)
const { isOutside, x } = useMouseInElement(chartWrapperEl)
const { width, height } = useElementBounding(tooltipContainer)
const { top, bottom } = useElementBounding(chartWrapperEl)

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------

const leftOffset = computed<number>((prev) => isOutside.value ? (prev ?? 0) : elementX.value)
const datetime = computed(() => mapPositionToTime(leftOffset.value))
const bars = computedWithControl(rowManager.getFlattenedRows, () => rowManager.getFlattenedRows().flatMap(row => row.bars))
const tooltipStylePosition = computed(() => {
  // Try to check if the tooltip will be outside of the viewport or not
  // Since we have the value from composable already, this is without IntersectionObserver
  if (top.value - height.value > 0) {
    return {
      top: `${top.value}px`,
      transform: `translateY(-100%)`,
      left: `${x.value-(width.value/2)}px`
    }
  }

  return {
      top: `${bottom.value}px`,
      left: `${x.value-(width.value/2)}px`
    }
})

// -----------------------------
// 6. WATCHERS
// -----------------------------

// Can probably be a computed instead of watcher, but there is no throttled computed
watchThrottled(leftOffset, () => {
  const hitBarsElement = []
  const cursorTime = toDayjs(datetime.value)
  // For each bar, we check if current time pointed by the cursor is in the bar time range
  for (let i = 0; i < bars.value.length; i++) {
    const element = bars.value[i]!;
    const begin = toDayjs(element[barStart.value])
    const end = toDayjs(element[barEnd.value])
    if (cursorTime.isBetween(begin, end)) {
      hitBarsElement.push(element)
    }
  }
  hitBars.value = hitBarsElement
}, { throttle: 200 })
</script>

<template>
  <div class="g-grid-pointer-marker-container" :style="{
    left: `${leftOffset}px`
  }">
    <div class="g-grid-pointer-marker-marker" :style="{
      border: `1px dashed ${colors.markerCurrentTime}`
    }" />
    <teleport to="body">
      <transition name="g-fade" mode="out-in">
        <div
          v-if="!isOutside"
          ref="tooltip"
          class="g-grid-pointer-marker-tooltip"
          :style="tooltipStylePosition"
        >
        <slot name="pointer-marker-tooltips" v-bind="{ hitBars, datetime }">
          <div class="g-grid-pointer-marker-tooltip-content" :style="{ background: colors.primary, color: colors.text }">
            <div style="font-weight: bold;">Event at {{ datetime }}</div>
            <ul>
              <li v-for="bar in hitBars" :key="bar.ganttBarConfig.id">
                {{ bar.ganttBarConfig.label ?? bar.ganttBarConfig.id }}
              </li>
            </ul>
          </div>
        </slot>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style>
.g-grid-pointer-marker-container {
  position: absolute;
  height: 100%;
  display: flex;
  z-index: 5;
  pointer-events: none;
}

.g-grid-pointer-marker-tooltip {
  position: fixed;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75em;
  z-index: 1000;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.g-grid-pointer-marker-tooltip-content {
  padding: 8px;
}

.g-grid-pointer-marker-marker {
  width: 0px;
  height: calc(100% - 2px);
  display: flex;
}

.g-grid-pointer-marker-text {
  font-size: x-small;
}
</style>
